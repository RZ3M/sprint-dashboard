import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get ALL tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Get user state
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    // Return all tasks in one array, grouped for stats
    const taskList = tasks || [];
    const completed = taskList.filter(t => t.completed);
    const active = taskList.filter(t => !t.completed);

    return NextResponse.json({
      tasks: active,
      completed: completed,
      energyLevel: dailyLog?.energy_level || 'medium',
      stats: {
        urgent: active.filter(t => t.category === 'urgent').length,
        admin: active.filter(t => t.category === 'admin').length,
        creative: active.filter(t => t.category === 'creative').length,
        deadline: active.filter(t => t.category === 'deadline').length,
      }
    });

  } catch (error) {
    console.error('Sprint API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, taskId, energyLevel } = body;
    
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    if (action === 'completeTask') {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'uncompleteTask') {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: false, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) return NextResponse.json({ error: 'Failed to uncomplete task' }, { status: 500 });
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

      if (error) return NextResponse.json({ error: 'Failed to update energy' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Sprint POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
