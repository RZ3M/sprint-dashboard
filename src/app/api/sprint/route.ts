import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    // Use Toronto timezone for date
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' })).toISOString().split('T')[0];
    
    // Get ALL tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Get sprints for today
    const { data: sprints } = await supabase
      .from('sprints')
      .select('*')
      .eq('date', today)
      .order('sprint_number');

    // Ensure 4 sprints exist for today
    const existingSprintNumbers = (sprints || []).map(s => s.sprint_number);
    const missingSprints = [1, 2, 3, 4].filter(n => !existingSprintNumbers.includes(n));
    
    if (missingSprints.length > 0) {
      const sprintsToInsert = missingSprints.map(num => ({
        sprint_number: num,
        date: today,
        title: `Sprint ${num}`
      }));
      
      await supabase.from('sprints').insert(sprintsToInsert);
    }

    // Re-fetch sprints after ensuring they exist
    const { data: allSprints } = await supabase
      .from('sprints')
      .select('*')
      .eq('date', today)
      .order('sprint_number');

    // Get user state
    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    // Get highlight task details if set (including completed status from task)
    let highlightTask = null;
    let highlightCompleted = false;
    if (dailyLog?.highlight_task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', dailyLog.highlight_task_id)
        .single();
      highlightTask = task;
      highlightCompleted = task?.completed ?? false;
    }

    const taskList = tasks || [];
    const completed = taskList.filter(t => t.completed);
    const active = taskList.filter(t => !t.completed);

    return NextResponse.json({
      tasks: active,
      completed: completed,
      sprints: allSprints || [],
      energyLevel: dailyLog?.energy_level || 'medium',
      highlightTask: highlightTask,
      highlightCompleted: highlightCompleted,
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
    const { action, taskId, sprintId, energyLevel } = body;
    
    const supabase = createAdminClient();
    // Use Toronto timezone for date
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' })).toISOString().split('T')[0];

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

    if (action === 'assignTask') {
      // sprintId null = backlog
      const { error } = await supabase
        .from('tasks')
        .update({ sprint_id: sprintId, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) return NextResponse.json({ error: 'Failed to assign task' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'setHighlight') {
      // Ensure daily_log exists - upsert on date conflict
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          date: today,
          highlight_task_id: taskId,
          highlight_completed: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'date' });

      if (error) {
        console.error('Failed to set highlight:', error);
        return NextResponse.json({ error: 'Failed to set highlight' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'completeHighlight') {
      // Get the highlight task ID
      const { data: dailyLog } = await supabase
        .from('daily_logs')
        .select('highlight_task_id')
        .eq('date', today)
        .single();
      
      if (!dailyLog?.highlight_task_id) {
        return NextResponse.json({ error: 'No highlight set' }, { status: 400 });
      }
      
      // Get current task completed status
      const { data: task } = await supabase
        .from('tasks')
        .select('completed')
        .eq('id', dailyLog.highlight_task_id)
        .single();
      
      const newState = !(task?.completed ?? false);
      
      // Update the task's completed status (this syncs with sprint view)
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ completed: newState, updated_at: new Date().toISOString() })
        .eq('id', dailyLog.highlight_task_id);

      if (taskError) return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
      return NextResponse.json({ success: true, completed: newState });
    }

    if (action === 'clearHighlight') {
      const { error } = await supabase
        .from('daily_logs')
        .update({ highlight_task_id: null, highlight_completed: false, updated_at: new Date().toISOString() })
        .eq('date', today);

      if (error) return NextResponse.json({ error: 'Failed to clear highlight' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Sprint POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
