import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get ALL tasks (both completed and uncompleted)
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Group uncompleted by category
    const buckets = {
      urgent: (tasks || []).filter(t => t.category === 'urgent' && !t.completed),
      admin: (tasks || []).filter(t => t.category === 'admin' && !t.completed),
      creative: (tasks || []).filter(t => t.category === 'creative' && !t.completed),
      deadline: (tasks || []).filter(t => t.category === 'deadline' && !t.completed),
    };

    // Get user state (current sprint, energy level)
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    return NextResponse.json({
      ...buckets,
      currentSprint: dailyLog?.sprints_completed || 'admin',
      energyLevel: dailyLog?.energy_level || 'medium',
      highlightTaskId: dailyLog?.highlight_task_id || null,
      highlightCompleted: dailyLog?.highlight_completed || false,
    });

  } catch (error) {
    console.error('Sprint API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentSprint, energyLevel, action } = body;
    
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    if (action === 'setHighlight') {
      const { taskId } = body;
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          date: today,
          highlight_task_id: taskId,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to set highlight:', error);
        return NextResponse.json({ error: 'Failed to set highlight' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'completeTask') {
      const { taskId } = body;
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        console.error('Failed to complete task:', error);
        return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'uncompleteTask') {
      const { taskId } = body;
      const { error } = await supabase
        .from('tasks')
        .update({ completed: false, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        console.error('Failed to uncomplete task:', error);
        return NextResponse.json({ error: 'Failed to uncomplete task' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'updateEnergy') {
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          date: today,
          energy_level: energyLevel,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to update energy:', error);
        return NextResponse.json({ error: 'Failed to update energy' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Sprint POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
