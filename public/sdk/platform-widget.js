/**
 * Maz Expeditions Platform Widget SDK v1.0
 * 
 * [SKILL: SDK Engineering & Distribution]
 */
(function() {
  const BASE_URL = window.location.origin; // Assuming the SDK is served from the same origin

  const MazWidget = {
    init: function(config) {
      this.tenantId = config.tenantId;
      this.apiKey = config.apiKey;
      this.containerId = config.containerId || 'maz-tour-widget';
      this.theme = config.theme || 'modern';
      this.primaryColor = config.primaryColor || '#0d9488';
      
      this.render();
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

      container.innerHTML = '<div style="padding:20px;text-align:center;font-family:sans-serif;">Loading Tours...</div>';

      const data = await this.fetchTours();
      const tours = data.tours || [];

      if (tours.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;font-family:sans-serif;">No tours available at the moment.</div>';
        return;
      }

      let html = `
        <div style="font-family: 'Inter', system-ui, sans-serif; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; padding: 10px;">
      `;

      tours.forEach(tour => {
        html += `
          <div style="background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); transition: transform 0.2s ease;">
            <div style="height: 200px; background: #f3f4f6; position: relative;">
              <img src="${tour.image || ''}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://placehold.co/400x300?text=Tour+Image'"/>
              <div style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; color: ${this.primaryColor};">
                ${tour.currency} ${tour.price.toLocaleString()}
              </div>
            </div>
            <div style="padding: 20px;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">${tour.title}</h3>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${tour.duration || 'Flexible'} duration</p>
              <button 
                onclick="window.open('${BASE_URL}/plan-my-trip?tourId=${tour.id}&tenant=${this.tenantId}', '_blank')"
                style="width: 100%; padding: 12px; background: ${this.primaryColor}; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;"
                onmouseover="this.style.opacity='0.9'"
                onmouseout="this.style.opacity='1'"
              >
                Book Now
              </button>
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
