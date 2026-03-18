import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTorontoDateString } from '../../../lib/server-utils';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const today = getTorontoDateString();
    
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

    // Filter tasks: backlog (no sprint_id) + today's sprints for display
    const todaySprintIds = (allSprints || []).map(s => s.id);
    const taskList = tasks || [];
    const displayTasks = taskList.filter(t => 
      t.sprint_id === null || todaySprintIds.includes(t.sprint_id)
    );

    // Filter tasks: today's sprints ONLY for stats
    const todayTasks = taskList.filter(t => todaySprintIds.includes(t.sprint_id));

    const completed = displayTasks.filter(t => t.completed);
    const active = displayTasks.filter(t => !t.completed);
    
    // Stats based on today's sprint tasks only
    const statsActive = todayTasks.filter(t => !t.completed);

    return NextResponse.json({
      tasks: active,
      completed: completed,
      sprints: allSprints || [],
      energyLevel: dailyLog?.energy_level || 'medium',
      highlightTask: highlightTask,
      highlightCompleted: highlightCompleted,
      stats: {
        urgent: statsActive.filter(t => t.category === 'urgent').length,
        admin: statsActive.filter(t => t.category === 'admin').length,
        creative: statsActive.filter(t => t.category === 'creative').length,
        deadline: statsActive.filter(t => t.category === 'deadline').length,
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
    const { action, taskId, sprintId, energyLevel, movedBy } = body;
    
    const supabase = createAdminClient();
    const today = getTorontoDateString();

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
      // Track who moved the task (user or system)
      const isUserMove = movedBy === 'user';
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          sprint_id: sprintId, 
          last_moved_by: isUserMove ? 'user' : 'system',
          last_moved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) return NextResponse.json({ error: 'Failed to assign task' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'dailyReset') {
      // This action is called at end of day to:
      // 1. Move incomplete tasks to backlog
      // 2. Increment skip_count for tasks that were in sprints (not user-moved)
      // 3. Mark tasks with skip_count >= 3 as urgent
      
      // Get today's sprint IDs
      const { data: todaySprints } = await supabase
        .from('sprints')
        .select('id')
        .eq('date', today);
      
      const todaySprintIds = todaySprints?.map(s => s.id) || [];
      
      if (todaySprintIds.length === 0) {
        return NextResponse.json({ success: true, resetCount: 0, message: 'No sprints found for today' });
      }

      // Get all active tasks that are in today's sprints
      const { data: incompleteTasks } = await supabase
        .from('tasks')
        .select('id, sprint_id, skip_count, category, last_moved_by')
        .eq('completed', false)
        .in('sprint_id', todaySprintIds);

      let resetCount = 0;
      
      if (incompleteTasks && incompleteTasks.length > 0) {
        // Increment skip_count for tasks that weren't manually moved by user
        const tasksToSkip = incompleteTasks.filter(t => t.last_moved_by !== 'user');
        
        for (const task of tasksToSkip) {
          const newSkipCount = (task.skip_count || 0) + 1;
          const newCategory = newSkipCount >= 3 ? 'urgent' : task.category;
          
          await supabase
            .from('tasks')
            .update({ 
              skip_count: newSkipCount,
              category: newCategory,
              sprint_id: null, // Move to backlog
              last_moved_by: 'system',
              last_moved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id);
          
          resetCount++;
        }
      }

      return NextResponse.json({ success: true, resetCount });
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

    if (action === 'logWork') {
      const { taskId, sprintCategory, durationMinutes, energyLevel, notes } = body;
      
      const { error } = await supabase
        .from('work_logs')
        .insert({
          date: today,
          task_id: taskId || null,
          sprint_category: sprintCategory || null,
          duration_minutes: durationMinutes || 0,
          energy_level: energyLevel || 'medium',
          notes: notes || '',
        });

      if (error) {
        console.error('Failed to log work:', error);
        return NextResponse.json({ error: 'Failed to log work' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'getWorkLogs') {
      const { data: workLogs } = await supabase
        .from('work_logs')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: false });

      let logsWithTasks = workLogs || [];
      if (logsWithTasks.length > 0) {
        const taskIds = logsWithTasks.filter(l => l.task_id).map(l => l.task_id);
        if (taskIds.length > 0) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .in('id', taskIds);
          
          const taskMap: Record<string, string> = {};
          (tasks || []).forEach(t => { taskMap[t.id] = t.title; });
          logsWithTasks = logsWithTasks.map(l => ({
            ...l,
            task_title: l.task_id ? taskMap[l.task_id] || 'Deleted task' : null
          }));
        }
      }

      return NextResponse.json({ workLogs: logsWithTasks });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Sprint POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
