// app/api/brain-dump/route.ts — Save brain dump tasks from OpenClaw
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

// This endpoint receives already-processed tasks from OpenClaw
// OpenClaw handles the LLM processing (categorization, extraction)

export async function POST(request: Request) {
  try {
    const { tasks, summary, user_id } = await request.json();
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Save brain dump record (for history)
    const { data: dumpRecord, error: dumpError } = await supabase
      .from('brain_dumps')
      .insert({
        raw_content: summary || '',
        processed_content: summary || '',
        tasks_extracted: tasks,
      })
      .select()
      .single();

    if (dumpError) {
      console.error('Failed to save brain dump:', dumpError);
      return NextResponse.json({ error: 'Failed to save brain dump' }, { status: 500 });
    }

    // Save extracted tasks to tasks table
    const tasksToInsert = tasks.map((task: any) => ({
      title: task.title,
      description: task.description || task.summary || '',
      category: task.category,
      source: 'brain_dump',
      deadline: task.deadline || null,
      completed: false,
      time_estimate_minutes: task.time_estimate_minutes || null,
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert);

    if (tasksError) {
      console.error('Failed to save tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 });
    }

    console.log(`Brain dump saved: ${tasks.length} tasks added`);

    return NextResponse.json({
      success: true,
      dump_id: dumpRecord.id,
      tasks_added: tasks.length,
    });

  } catch (error) {
    console.error('Brain dump error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to retrieve brain dump history
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('brain_dumps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch brain dumps:', error);
      return NextResponse.json({ error: 'Failed to fetch brain dumps' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Brain dump GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
