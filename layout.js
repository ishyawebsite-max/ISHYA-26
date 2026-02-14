// --- 1. HEADER COMPONENT ---
class IshyaHeader extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <style>
          .ishya-header-spacer { height: var(--header-h); display: block; }
          .ishya-nav-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: var(--bar-height); background: var(--ishya-dark-aero); backdrop-filter: blur(35px) saturate(160%); -webkit-backdrop-filter: blur(35px) saturate(160%); border-bottom: 1px solid rgba(255, 255, 255, 0.1); z-index: 9997; overflow: hidden; }
          .ishya-fluid-layer { position: absolute; inset: -30%; z-index: -1; opacity: 0.2; filter: blur(60px); background: radial-gradient(circle at 15% 25%, var(--ishya-green) 0%, transparent 40%), radial-gradient(circle at 85% 75%, var(--ishya-gold) 0%, transparent 40%), radial-gradient(circle at 50% 50%, var(--ishya-peach) 0%, transparent 35%), radial-gradient(circle at 30% 85%, var(--ishya-creme) 0%, transparent 30%); animation: fluidDrift 30s ease-in-out infinite alternate; will-change: transform; }
          @keyframes fluidDrift { from { transform: translate(0, 0) scale(1); } to { transform: translate(4%, 3%) scale(1.15); } }
          .ishya-nav-backdrop::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--ishya-glass-bright), transparent); z-index: 2; }
          .ishya-nav-container { position: fixed; z-index: 9999; top: 10px; left: 50%; transform: translateX(-50%); width: 56px; height: 56px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--ishya-gold); border-radius: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); overflow: hidden; cursor: pointer; will-change: width, height, background; transition: width 0.6s var(--anim-fluid), height 0.6s var(--anim-fluid), background 0.4s ease, border-radius 0.4s ease; }
          .ishya-logo-btn { position: absolute; top: 0; left: 0; width: 100%; height: 56px; display: flex; justify-content: center; align-items: center; transition: opacity 0.3s ease, transform 0.3s ease; }
          .ishya-logo-btn img { height: 38px; width: auto; filter: drop-shadow(0 0 10px var(--ishya-green)); }
          .ishya-menu-grid { display: flex; width: 100%; height: 100%; align-items: center; justify-content: space-evenly; opacity: 0; pointer-events: none; box-sizing: border-box; }
          .ishya-link { display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none; color: #fff; padding: 8px; min-width: 90px; transition: transform 0.3s var(--anim-fluid); }
          .ishya-link svg { width: 24px; height: 24px; stroke: var(--ishya-green); fill: none; stroke-width: 1.8; margin-bottom: 5px; transition: stroke 0.3s ease, transform 0.3s ease; }
          .ishya-link span { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--ishya-creme); opacity: 0.8; }
          .ishya-nav-container.expanded { width: 880px; height: 68px; border-radius: 14px; background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.15); top: 4px; }
          .ishya-nav-container.expanded .ishya-logo-btn { opacity: 0; transform: scale(0.8); pointer-events: none; }
          .ishya-nav-container.expanded .ishya-menu-grid { opacity: 1; pointer-events: auto; }
          .ishya-link:hover { transform: translateY(-3px); }
          .ishya-link:hover svg { stroke: var(--ishya-gold); }
          .ishya-link:hover span { opacity: 1; color: #fff; text-shadow: 0 0 10px var(--ishya-gold); }
          @media screen and (max-width: 900px) {
              .ishya-nav-container { top: 10px; width: 56px; height: 56px; }
              .ishya-nav-container.expanded { width: 94%; height: auto; min-height: 380px; top: 10px; border-radius: 24px; background: rgba(10, 15, 20, 0.9); padding-bottom: 30px; }
              .ishya-nav-container.expanded .ishya-menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 75px 15px 0 15px; }
              .ishya-link { background: rgba(255,255,255,0.04); padding: 25px 10px; clip-path: polygon(0 0, 100% 0, 100% 88%, 88% 100%, 0 100%); border: 1px solid rgba(255,255,255,0.06); }
              .ishya-nav-container.expanded .ishya-logo-btn { opacity: 1; transform: scale(1); height: 60px; border-bottom: 1px solid rgba(255,255,255,0.1); }
          }
        </style>
  
        <div class="ishya-header-spacer"></div>
        <div id="ishya-floating-nav-wrapper">
            <div class="ishya-nav-backdrop">
                <div class="ishya-fluid-layer"></div>
            </div>
            <nav class="ishya-nav-container" id="ishyaHeader">
                <div class="ishya-logo-btn">
                    <!-- Note: Ensure this path is correct relative to your HTML files -->
                    <img src="/Logo Ishya.ico" alt="ISHYA">
                </div>
                <div class="ishya-menu-grid">
                    <a href="/index.html" class="ishya-link"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span>Home</span></a>
                    <a href="/EVENTS/index.html" class="ishya-link"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg><span>Events</span></a>
                    <a href="/bookrooms/indexf.html" class="ishya-link"><svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M9 6a3 3 0 1 0 6 0"/><circle cx="12" cy="13" r="3"/></svg><span>Book Rooms</span></a>
                    <a href="/TEAM/index.html" class="ishya-link"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Team</span></a>
                    <a href="/Gallery/index.html" class="ishya-link"><svg viewBox="0 0 24 24"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg><span>Gallery</span></a>
                </div>
            </nav>
        </div>
      `;
  
      // --- LOGIC: Attach the event listeners for expanding the menu ---
      const nav = this.querySelector('#ishyaHeader');
      let isExpanded = false;
      
      const toggleNav = (state) => {
          isExpanded = (state !== undefined) ? state : !isExpanded;
          nav.classList.toggle('expanded', isExpanded);
      };
  
      nav.addEventListener('mouseenter', () => { if(window.innerWidth > 900 && !isExpanded) nav.classList.add('expanded'); });
      nav.addEventListener('mouseleave', () => { if(window.innerWidth > 900 && !isExpanded) nav.classList.remove('expanded'); });
      nav.addEventListener('click', (e) => { if (e.target.closest('a')) return; toggleNav(); });
      document.addEventListener('click', (e) => { if (!nav.contains(e.target) && isExpanded) toggleNav(false); });
    }
  }
  customElements.define('ishya-header', IshyaHeader);
  
  
  // --- 2. FOOTER COMPONENT ---
  class IshyaFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
      <style>
      .footer-section { 
          background: rgba(24, 28, 16, 0.95); 
          border-radius: 50px 50px 0 0; 
          padding: 60px 5vw 30px; 
          text-align: center; 
          border-top: 1px solid var(--accent-olive); 
          backdrop-filter: blur(10px); 
          margin-top: 10vh; 
          position: relative;
          z-index: 10;
      }
      .footer-logo { font-family: var(--font-fold); font-size: 10vw; color: transparent; -webkit-text-stroke: 1px #444; line-height: 0.8; opacity: 0.6; transition: 0.5s; display: block; margin-bottom: 40px; }
      .footer-logo:hover { color: var(--accent-olive); opacity: 1; text-shadow: 0 0 30px var(--accent-green); }
  
      .footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1.5fr; 
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
          text-align: left;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 40px;
          align-items: start;
      }
  
      .footer-col h4 { color: var(--accent-gold); font-family: var(--font-tech); font-size: 1.1rem; margin-bottom: 15px; letter-spacing: 1px; }
      .footer-col p, .footer-col a { font-family: var(--font-body); font-size: 0.95rem; color: #bbb; line-height: 1.6; text-decoration: none; display: block; transition: 0.3s; }
      .footer-col a:hover { color: var(--accent-gold); }
  
      .social-icons-footer { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px; }
      .social-icons-footer a { 
          color: #888; transition: 0.3s; font-size: 1.3rem; 
          width: 40px; height: 40px; border-radius: 50%; border: 1px solid #444; 
          display: flex; align-items: center; justify-content: center;
      }
      .social-icons-footer a:hover { color: var(--bg-dark); background: var(--accent-gold); border-color: var(--accent-gold); transform: translateY(-3px); }
  
      .map-container {
          width: 100%; height: 200px; border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(214, 194, 106, 0.3);
          box-shadow: 0 5px 20px rgba(0,0,0,0.5);
      }
      .map-frame { width: 100%; height: 100%; border: 0; filter: invert(90%) hue-rotate(180deg) brightness(0.9); } 
  
      .grievance-btn { margin-top: 15px; color: var(--accent-gold) !important; text-decoration: underline !important; font-weight: bold; }
      .copyright { color: #555; margin-top: 50px; font-size: 0.7rem; font-family: var(--font-tech); text-align: center; width: 100%; }
  
      @media (max-width: 950px) {
          .footer-logo { font-size: 18vw; margin-bottom: 30px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .footer-col { display: flex; flex-direction: column; align-items: center; }
          .social-icons-footer { justify-content: center; }
          .map-container { height: 250px; width: 100%; }
          .footer-section { padding-top: 40px; }
      }
      </style>
  
      <footer class="footer-section">
          <div class="footer-content">
              <h2 class="footer-logo">ISHYA</h2>
              <div class="footer-grid">
                  <div class="footer-col">
                      <h4>LOCATION</h4>
                      <p>IISER Thiruvananthapuram,<br>Maruthamala PO, Vithura,<br>Thiruvananthapuram - 695551,<br>Kerala, India.</p>
                  </div>
                  <div class="footer-col">
                      <h4>CONTACT US</h4>
                      <p>+91 90745 66956</p>
                      <p>ishya@iisertvm.ac.in</p>
                      <div class="social-icons-footer">
                          <a href="https://www.facebook.com/ishya.iisertvm/" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                          <a href="https://www.instagram.com/ishyaiiser/?hl=en" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                          <a href="https://x.com/ishya_iiser" aria-label="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
                          <a href="https://www.youtube.com/c/ishyaiisertvm" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
                      </div>
                      <div style="margin-top: 20px;">
                          <p style="font-size: 0.8rem; color: #888;">Facing Any Problems?</p>
                          <a href="https://tally.so/r/Zj6zbA" target="_blank" class="grievance-btn">Grievance Redressal</a>
                      </div>
                  </div>
                  <div class="footer-col">
                      <h4>FIND US</h4>
                      <div class="map-container">
                          <iframe class="map-frame" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.095804976186!2d77.13271147563017!3d8.682439094316278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05bec780ab70fd%3A0xc960a94d0cef086f!2sIndian%20Institute%20of%20Science%20Education%20and%20Research%20Thiruvananthapuram!5e0!3m2!1sen!2sin!4v1770744366350!5m2!1sen!2sin" allowfullscreen="" loading="lazy"></iframe>
                      </div>
                  </div>
              </div>
              <p class="copyright">© 2026 ISHYA. FLAMES IN EVERY FOLD.</p>
          </div>
      </footer>
      `;
    }
  }
  customElements.define('ishya-footer', IshyaFooter);
