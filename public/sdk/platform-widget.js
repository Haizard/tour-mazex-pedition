/**
 * Maz Expeditions Platform Widget SDK v1.1 - Premium Edition
 * 
 * [SKILL: Visual Excellence & SDK Engineering]
 */
(function() {
  const BASE_URL = window.location.origin;

  const MazWidget = {
    init: function(config) {
      this.tenantId = config.tenantId;
      this.apiKey = config.apiKey;
      this.containerId = config.containerId || 'maz-tour-widget';
      this.theme = config.theme || 'modern';
      this.primaryColor = config.primaryColor || '#0d9488';
      this.isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      this.injectStyles();
      this.render();
    },

    injectStyles: function() {
      if (document.getElementById('maz-widget-styles')) return;
      
      const styles = `
        #${this.containerId} {
          --maz-primary: ${this.primaryColor};
          --maz-bg: ${this.isDark ? '#111827' : '#ffffff'};
          --maz-card-bg: ${this.isDark ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.8)'};
          --maz-text: ${this.isDark ? '#f9fafb' : '#111827'};
          --maz-text-muted: ${this.isDark ? '#9ca3af' : '#6b7280'};
          --maz-border: ${this.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        }

        .maz-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 32px;
          padding: 20px;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .maz-card {
          position: relative;
          background: var(--maz-card-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--maz-border);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }

        .maz-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-color: var(--maz-primary);
        }

        .maz-image-container {
          height: 240px;
          overflow: hidden;
          position: relative;
        }

        .maz-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .maz-card:hover .maz-image {
          transform: scale(1.1);
        }

        .maz-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 14px;
          border-radius: 50px;
          font-weight: 800;
          font-size: 13px;
          color: var(--maz-primary);
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          z-index: 2;
        }

        .maz-content {
          padding: 24px;
        }

        .maz-title {
          margin: 0 0 10px 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--maz-text);
          letter-spacing: -0.02em;
        }

        .maz-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          color: var(--maz-text-muted);
          font-weight: 500;
        }

        .maz-btn {
          width: 100%;
          padding: 14px;
          background: var(--maz-primary);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .maz-btn:hover {
          filter: brightness(1.1);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        /* Shimmer Loading */
        .maz-shimmer {
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-repeat: no-repeat;
          background-size: 800px 400px; 
          display: inline-block;
          position: relative; 
          animation: mazshimmer 1s linear infinite forwards;
        }

        @keyframes mazshimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
      `;
      const styleTag = document.createElement('style');
      styleTag.id = 'maz-widget-styles';
      styleTag.innerHTML = styles;
      document.head.appendChild(styleTag);
    },

    fetchTours: async function() {
      try {
        const response = await fetch(`${BASE_URL}/api/public/v1/tours`, {
          headers: {
            'x-tenant-id': this.tenantId,
            'x-api-key': this.apiKey
          }
        });
        return await response.json();
      } catch (error) {
        console.error("MazWidget: Failed to fetch tours", error);
        return { tours: [] };
      }
    },

    render: async function() {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      container.innerHTML = `
        <div class="maz-grid">
          ${[1, 2, 3].map(() => `
            <div class="maz-card" style="pointer-events:none; opacity: 0.6;">
              <div class="maz-image-container maz-shimmer"></div>
              <div class="maz-content">
                <div class="maz-shimmer" style="height:24px; width:70%; border-radius:4px; margin-bottom:12px;"></div>
                <div class="maz-shimmer" style="height:16px; width:40%; border-radius:4px; margin-bottom:24px;"></div>
                <div class="maz-shimmer" style="height:48px; width:100%; border-radius:14px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      const data = await this.fetchTours();
      const tours = data.tours || [];

      if (tours.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;color:var(--maz-text-muted);">No discovery tours available.</div>';
        return;
      }

      let html = `<div class="maz-grid">`;

      tours.forEach(tour => {
        html += `
          <div class="maz-card" onclick="window.open('${BASE_URL}/plan-my-trip?tourId=${tour.id}&tenant=${this.tenantId}', '_blank')">
            <div class="maz-image-container">
              <img src="${tour.image || ''}" class="maz-image" onerror="this.src='https://placehold.co/600x400?text=Tour+Discovery'"/>
              <div class="maz-badge">
                ${tour.currency} ${tour.price.toLocaleString()}
              </div>
            </div>
            <div class="maz-content">
              <h3 class="maz-title">${tour.title}</h3>
              <div class="maz-meta">
                <span>⚡ ${tour.duration || 'Flexible'}</span>
                <span>⭐ Premium</span>
              </div>
              <button class="maz-btn">Explore Itinerary</button>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      container.innerHTML = html;
    }
  };

  window.MazWidget = MazWidget;
})();
