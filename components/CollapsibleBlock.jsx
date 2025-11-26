import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Button,
} from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';

/**
 * Reusable collapsible block component for discount sections
 * @param {string} title - The title to display in the header (e.g., "Membership Fee Discount 1")
 * @param {string} summary - A one-line summary of the configuration
 * @param {boolean} expanded - Whether the block is currently expanded
 * @param {function} onToggle - Callback when expand/collapse is clicked
 * @param {function} onDelete - Callback when delete button is clicked
 * @param {ReactNode} children - The content to show when expanded
 * @param {boolean} showFooterActions - Whether to show Save/Discard buttons
 * @param {function} onSave - Callback when Save button is clicked
 * @param {function} onDiscard - Callback when Discard button is clicked
 */
export default function CollapsibleBlock({
  title,
  summary,
  expanded,
  onToggle,
  onDelete,
  children,
  showFooterActions = false,
  onSave,
  onDiscard,
}) {
  return (
    <Paper
      sx={{
        mb: 3,
        border: '1px solid',
        borderColor: 'neutral.200',
        boxShadow: 'none',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          cursor: 'pointer',
          backgroundColor: expanded ? 'background.paper' : 'background.default',
          borderBottom: expanded ? '1px solid' : 'none',
          borderBottomColor: 'neutral.200',
          '&:hover': {
            backgroundColor: expanded ? 'background.paper' : 'rgba(22, 108, 184, 0.04)',
          },
        }}
        onClick={onToggle}
      >
        <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 500,
              mb: expanded ? 0 : 0.5,
            }}
          >
            {title}
          </Typography>
          {!expanded && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {summary}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteRounded />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'text.secondary',
            }}
          >
            <ExpandMoreRounded />
          </IconButton>
        </Box>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ p: 3 }}>
          {children}
          
          {/* Footer Actions */}
          {showFooterActions && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 1, 
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderTopColor: 'neutral.200',
              }}
            >
              <Button 
                variant="text" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscard && onDiscard();
                }}
                sx={{ textTransform: 'none' }}
              >
                Discard
              </Button>
              <Button 
                variant="contained" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave && onSave();
                }}
                sx={{ textTransform: 'none' }}
              >
                Save
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
