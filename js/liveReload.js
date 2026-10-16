// Auto-Refresh & Live Real-Time Synchronization Engine
(function() {
  if (typeof window === 'undefined') return;

  let eventSource = null;
  let reconnectTimeout = null;

  function connectLiveReload() {
    try {
      if (eventSource) eventSource.close();
      eventSource = new EventSource('/api/live-reload');

      eventSource.onopen = function() {
        console.log('⚡ [LiveReload] Connected to dev server file watcher');
      };

      eventSource.onmessage = function(e) {
        if (!e.data) return;
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'change') {
            const file = payload.file || '';
            console.log('🔄 [LiveReload] File modified:', file);

            // Hot-swap CSS stylesheets without full page reload
            if (file.endsWith('.css')) {
              const links = document.querySelectorAll('link[rel="stylesheet"]');
              links.forEach(link => {
                const url = new URL(link.href, window.location.href);
                url.searchParams.set('_v', Date.now());
                link.href = url.toString();
              });
              if (window.App && window.App.showToast) {
                window.App.showToast('🎨 Stylesheet auto-updated!', 'info');
              }
              return;
            }

            // For JS, HTML, or other source code changes: save scroll position & reload page
            sessionStorage.setItem('nexus_scroll_pos', window.scrollY);
            if (window.App && window.App.currentTab) {
              sessionStorage.setItem('nexus_last_tab', window.App.currentTab);
            }
            window.location.reload();
          }
        } catch (err) {
          // Connected heartbeat or plain message
        }
      };

      eventSource.onerror = function() {
        if (eventSource) eventSource.close();
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectLiveReload, 2000);
      };
    } catch (err) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connectLiveReload, 2000);
    }
  }

  // Restore scroll position and active tab after reload
  window.addEventListener('DOMContentLoaded', function() {
    const savedScroll = sessionStorage.getItem('nexus_scroll_pos');
    if (savedScroll) {
      window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
      sessionStorage.removeItem('nexus_scroll_pos');
    }

    const savedTab = sessionStorage.getItem('nexus_last_tab');
    if (savedTab && window.App && window.App.switchTab) {
      window.App.switchTab(savedTab);
      sessionStorage.removeItem('nexus_last_tab');
    }
  });

  // Cross-tab real-time storage & state synchronization
  window.addEventListener('storage', function(e) {
    if (e.key === 'nexus_state_v1' || e.key === 'nexus_startup_onboard_draft') {
      console.log('🔄 [StateSync] Detected storage change from another tab/window');
      if (window.store && window.store.init) {
        window.store.init();
      }
      if (window.App && window.App.refreshCurrentView) {
        window.App.refreshCurrentView();
        window.App.updateHeaderStats();
      }
      if (window.StartupTablesModule && window.StartupTablesModule.fetchData) {
        window.StartupTablesModule.fetchData();
      }
      if (window.DatabaseModule && window.DatabaseModule.fetchTables) {
        window.DatabaseModule.fetchTables();
      }
    }
  });

  // Start live reload listener
  connectLiveReload();
})();
