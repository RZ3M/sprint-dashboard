import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    const cwd = path.join(process.cwd());
    execSync('node skills/google-integrations/scripts/triage.js run', { 
      cwd,
      stdio: 'pipe'
    });
    return NextResponse.json({ success: true, message: 'Triage completed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to run triage' }, { status: 500 });
  }
}
