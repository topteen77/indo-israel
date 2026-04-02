import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlined from '@mui/icons-material/HomeOutlined';

/**
 * App-style dashboard chrome: fixed sidebar + sticky topbar (similar layout to apravas_05 reference),
 * using the site’s light theme and purple gradient accents (Header-style).
 *
 * navGroups items support optional `badge` (string/number) to show count.
 *
 * @param {{ section?: string, items: { id: string|number, label: string, icon?: React.ReactNode, badge?: string|number }[] }[]} navGroups
 */
export default function DashboardShell({
  navGroups,
  activeId,
  onNavSelect,
  topbarTitle,
  roleLabel,
  userDisplayName,
  brandSubtitle = 'India–Israel Recruitment',
  children,
  onHome,
  onLogout,
}) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerWidth = 260;

  const closeMobile = () => setMobileOpen(false);

  const sidebarInner = (
    <>
      <Box
        sx={{
          p: 2.25,
          borderBottom: '1px solid #e8eaf0',
          cursor: onHome ? 'pointer' : 'default',
        }}
        onClick={() => {
          onHome?.();
          closeMobile();
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.15rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          APRAVAS
        </Typography>
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            mt: 0.5,
          }}
        >
          {brandSubtitle}
        </Typography>
      </Box>

      {navGroups.map((group, gi) => (
        <Box key={gi}>
          {group.section ? (
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: '#94a3b8',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                px: 2.25,
                pt: 2,
                pb: 0.75,
              }}
            >
              {group.section}
            </Typography>
          ) : null}
          {group.items.map((item) => {
            const selected = activeId === item.id;
            return (
              <Box
                key={String(item.id)}
                onClick={() => {
                  onNavSelect(item.id);
                  closeMobile();
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 2.25,
                  py: 1.125,
                  fontSize: '0.875rem',
                  color: selected ? '#667eea' : '#475569',
                  bgcolor: selected ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  borderLeft: '3px solid',
                  borderColor: selected ? '#667eea' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  '&:hover': {
                    bgcolor: selected ? 'rgba(102, 126, 234, 0.14)' : '#f3f4f8',
                    color: selected ? '#5a6fd6' : '#1e293b',
                  },
                }}
              >
                {item.icon ? (
                  <Box
                    sx={{
                      display: 'flex',
                      width: 22,
                      justifyContent: 'center',
                      color: 'inherit',
                      '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                    }}
                  >
                    {item.icon}
                  </Box>
                ) : null}
                <Typography
                  component="span"
                  sx={{ fontSize: 'inherit', fontWeight: selected ? 600 : 500, flex: 1 }}
                >
                  {item.label}
                </Typography>
                {item.badge !== undefined && item.badge !== null && String(item.badge) !== '' ? (
                  <Box
                    sx={{
                      ml: 1,
                      px: 0.9,
                      py: 0.15,
                      borderRadius: 999,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      bgcolor: selected ? 'rgba(102, 126, 234, 0.16)' : 'rgba(148,163,184,0.18)',
                      color: selected ? '#5a6fd6' : '#64748b',
                      border: '1px solid rgba(148,163,184,0.30)',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.badge}
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      ))}

      <Divider sx={{ my: 1.5, borderColor: '#e8eaf0' }} />
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<HomeOutlined />}
          onClick={() => {
            onHome?.();
            closeMobile();
          }}
          sx={{
            borderRadius: 2,
            borderColor: '#e2e8f0',
            color: '#64748b',
            mb: 1,
            textTransform: 'none',
          }}
        >
          Back to site
        </Button>
        {onLogout ? (
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={() => {
              onLogout();
              closeMobile();
            }}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#e2e8f0' }}
          >
            Logout
          </Button>
        ) : null}
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {isMdUp ? (
        <Box
          component="nav"
          aria-label="Dashboard"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            position: 'fixed',
            height: '100vh',
            overflowY: 'auto',
            bgcolor: '#fff',
            borderRight: '1px solid #e8eaf0',
            zIndex: theme.zIndex.drawer,
            boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
          }}
        >
          {sidebarInner}
        </Box>
      ) : (
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          {sidebarInner}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            bgcolor: '#fff',
            borderBottom: '1px solid #e8eaf0',
            px: { xs: 2, sm: 3.5 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}
        >
          {!isMdUp ? (
            <IconButton onClick={() => setMobileOpen(true)} edge="start" aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
            {topbarTitle}
          </Typography>
          {roleLabel ? (
            <Chip
              label={roleLabel}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 24,
                bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          ) : null}
          <Typography
            sx={{
              fontSize: '0.82rem',
              color: '#64748b',
              display: { xs: 'none', sm: 'block' },
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userDisplayName}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
