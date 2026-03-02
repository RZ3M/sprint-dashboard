import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const SPRINT_DATA_PATH = path.join(process.cwd(), 'data', 'sprints.json');
  
  try {
    if (fs.existsSync(SPRINT_DATA_PATH)) {
      const data = fs.readFileSync(SPRINT_DATA_PATH, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({ urgent: [], admin: [], creative: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load sprint data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const SPRINT_DATA_PATH = path.join(process.cwd(), 'data', 'sprints.json');
  
  try {
    const body = await request.json();
    const { currentSprint, energyLevel } = body;
    
    const data = {
      currentSprint,
      energyLevel,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(SPRINT_DATA_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sprint' }, { status: 500 });
  }
}
