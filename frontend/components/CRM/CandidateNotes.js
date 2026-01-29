import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Note,
  Add,
  Edit,
  Delete,
  Person,
} from '@mui/icons-material';
import api from '../../utils/api';

const CandidateNotes = ({ candidateId, applicationId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (candidateId || applicationId) {
      fetchNotes();
    }
  }, [candidateId, applicationId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/crm/notes?${candidateId ? `candidateId=${candidateId}` : `applicationId=${applicationId}`}`
      );
      if (response.data.success) {
        setNotes(response.data.data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setNoteText('');
    setTags([]);
    setTagInput('');
    setDialogOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteText(note.content);
    setTags(note.tags || []);
    setTagInput('');
    setDialogOpen(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    try {
      await api.delete(`/crm/notes/${noteId}`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      return;
    }

    try {
      const noteData = {
        candidateId,
        applicationId,
        content: noteText,
        tags: tags,
      };

      if (editingNote) {
        await api.put(`/crm/notes/${editingNote.id}`, noteData);
      } else {
        await api.post('/crm/notes', noteData);
      }

      setDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Note sx={{ mr: 1 }} />
            Notes & Tags
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleAddNote}
          >
            Add Note
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading notes...</Typography>
        ) : notes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No notes yet. Click &quot;Add Note&quot; to create one.
          </Typography>
        ) : (
          <List>
            {notes.map((note, index) => (
              <React.Fragment key={note.id}>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body1">{note.content}</Typography>
                        {note.tags && note.tags.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {note.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(note.createdAt).toLocaleString()} by {note.createdBy?.name || 'Unknown'}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteNote(note.id)}
                      sx={{ ml: 1 }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < notes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Add/Edit Note Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingNote ? 'Edit Note' : 'Add Note'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Note Content"
              fullWidth
              multiline
              rows={6}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ flex: 1 }}
                />
                <Button onClick={handleAddTag} variant="outlined" size="small">
                  Add
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveNote}
              variant="contained"
              disabled={!noteText.trim()}
            >
              {editingNote ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CandidateNotes;
