-- Create coaching note type enum
CREATE TYPE coaching_note_type AS ENUM ('manual', 'system');

-- Create coaching_notes table
CREATE TABLE coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_type coaching_note_type NOT NULL,
  content TEXT NOT NULL,
  created_by VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on tutor_id for faster queries
CREATE INDEX idx_coaching_notes_tutor_id ON coaching_notes(tutor_id);

-- Create index on created_at for ordering
CREATE INDEX idx_coaching_notes_created_at ON coaching_notes(created_at DESC);
