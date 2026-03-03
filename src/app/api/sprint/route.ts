import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SPRINT_DATA_PATH = path.join(process.cwd(), 'data', 'sprints.json');
const USER_STATE_PATH = path.join(process.cwd(), 'data', 'user-state.json');

function getBuckets() {
  if (fs.existsSync(SPRINT_DATA_PATH)) {
    const data = JSON.parse(fs.readFileSync(SPRINT_DATA_PATH, 'utf8'));
    if (data.urgent || data.admin || data.creative) {
      return data;
    }
  }
  return { urgent: [], admin: [], creative: [] };
}

export async function GET() {
  try {
    const buckets = getBuckets();
    
    let userState = { currentSprint: 'admin', energyLevel: 'medium' };
    if (fs.existsSync(USER_STATE_PATH)) {
      userState = JSON.parse(fs.readFileSync(USER_STATE_PATH, 'utf8'));
    }
    
    return NextResponse.json({ ...buckets, ...userState });
  } catch (error) {
    return NextResponse.json({ urgent: [], admin: [], creative: [], currentSprint: 'admin', energyLevel: 'medium' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentSprint, energyLevel } = body;
    
    const userState = {
      currentSprint,
      energyLevel,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(USER_STATE_PATH, JSON.stringify(userState, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sprint' }, { status: 500 });
  }
}
