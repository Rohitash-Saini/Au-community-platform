import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Welcome.css';

function Welcome() {
  const [activeSection, setActiveSection] = useState('home');

  // Smooth scroll handler
  const scrollToSection = (e, sectionId) => {
    if (e) e.preventDefault();
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -70; // offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Scroll listener for active link highlighting
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'community', 'opportunities', 'events', 'about'];
      const scrollPos = window.scrollY + 120;

      for (let sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="welcome-page-wrapper">

      {/* ========================================================
          NAVBAR
          ======================================================== */}
      <header className="welcome-top-nav">
        {/* Brand Logo */}
        <Link to="/" className="welcome-brand-logo" onClick={(e) => scrollToSection(e, 'home')}>
          <span className="brand-badge-au">AU</span>
          <div className="brand-text-col">
            <strong>Community</strong>
            <span>Platform</span>
          </div>
        </Link>

        {/* Center Nav Links with Active State & Smooth Scroll */}
        <nav className="welcome-nav-links">
          <a 
            href="#home" 
            className={activeSection === 'home' ? 'active' : ''} 
            onClick={(e) => scrollToSection(e, 'home')}
          >
            Home
          </a>
          <a 
            href="#community" 
            className={activeSection === 'community' ? 'active' : ''} 
            onClick={(e) => scrollToSection(e, 'community')}
          >
            Community
          </a>
          <a 
            href="#opportunities" 
            className={activeSection === 'opportunities' ? 'active' : ''} 
            onClick={(e) => scrollToSection(e, 'opportunities')}
          >
            Opportunities
          </a>
          <a 
            href="#events" 
            className={activeSection === 'events' ? 'active' : ''} 
            onClick={(e) => scrollToSection(e, 'events')}
          >
            Events
          </a>
          <a 
            href="#about" 
            className={activeSection === 'about' ? 'active' : ''} 
            onClick={(e) => scrollToSection(e, 'about')}
          >
            About
          </a>
        </nav>

        {/* Right Search & Actions */}
        <div className="welcome-nav-actions">
          <Link to="/login" className="btn-nav-outline">Login</Link>
          <Link to="/register" className="btn-nav-orange">Join Now</Link>
        </div>
      </header>


      {/* ========================================================
          1. HERO SECTION (#home)
          ======================================================== */}
      <main className="welcome-hero-section" id="home">

        {/* LEFT COLUMN: Main Heading & Description */}
        <div className="welcome-hero-left">

          <div className="welcome-sub-badge">
            A PRIVATE COMMUNITY FOR AU MEMBERS
          </div>

          <h1 className="welcome-hero-title">
            Build Your Future <br />
            <span className="text-orange">Together</span>
          </h1>

          <div className="welcome-hero-tagline">
            <span>Connect</span>
            <span className="dot orange">•</span>
            <span>Share</span>
            <span className="dot purple">•</span>
            <span>Learn</span>
            <span className="dot orange">•</span>
            <span>Help</span>
            <span className="dot purple">•</span>
            <span>Grow</span>
          </div>

          <p className="welcome-hero-desc">
            A professional community platform for AU Foundation students
            and faculty. Stay connected beyond the classroom, collaborate on projects,
            and discover opportunities for a brighter future.
          </p>

          <div className="welcome-cta-group">
            <Link to="/signup" className="btn-welcome-primary">
              Get Started <span>&rarr;</span>
            </Link>
            <a href="#community" onClick={(e) => scrollToSection(e, 'community')} className="btn-welcome-secondary">
              Explore Platform
            </a>
          </div>

          <div className="welcome-trust-badges">
            <div className="trust-badge-item">
              <span className="badge-icon-check">✓</span>
              <span>Private & Secure</span>
            </div>
            <div className="trust-badge-item">
              <span className="badge-icon">👥</span>
              <span>For AU Members Only</span>
            </div>
            <div className="trust-badge-item">
              <span className="badge-icon">📊</span>
              <span>Career Focused</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: App Preview Mockup & Floating Badges */}
        <div className="welcome-hero-right">

          <div className="welcome-handwritten-note">
            <div className="sun-rays">
              <span></span><span></span><span></span>
            </div>
            <p className="cursive-text">Same Community</p>
            <p className="cursive-text highlight">Bigger Opportunities</p>
          </div>

          <div className="floating-badge-card float-connect">
            <div className="float-icon purple">👥</div>
            <div>
              <strong>Connect</strong>
              <small>with AU Members</small>
            </div>
          </div>

          <div className="floating-badge-card float-learn">
            <div className="float-icon purple">📖</div>
            <div>
              <strong>Learn</strong>
              <small>from Faculty</small>
            </div>
          </div>

          <div className="floating-badge-card float-grow">
            <div className="float-icon purple">📈</div>
            <div>
              <strong>Grow</strong>
              <small>Your Career</small>
            </div>
          </div>

          {/* Community UI Mockup Window */}
          <div className="preview-mockup-window">
            <div className="mockup-sidebar">
              <div className="mockup-logo">
                <span className="mockup-dot"></span>
                <strong>AU</strong>
              </div>
              <ul className="mockup-menu">
                <li className="active">🏠 Home</li>
                <li>👥 Connections</li>
                <li>💼 Opportunities</li>
                <li>📚 Courses</li>
                <li>📄 Resources</li>
                <li>🔔 Notifications</li>
              </ul>
            </div>

            <div className="mockup-feed">
              <div className="mockup-post-card">
                <div className="mockup-post-header">
                  <div className="mockup-avatar"></div>
                  <div className="mockup-header-lines">
                    <span className="line-sm"></span>
                    <span className="line-xs"></span>
                  </div>
                </div>
                <div className="mockup-image-placeholder">
                  <div className="landscape-mountains">▲ ▲</div>
                </div>
                <div className="mockup-post-actions">
                  <span>♥ Like</span>
                  <span>💬 Comment</span>
                  <span>↗ Share</span>
                </div>
              </div>
            </div>

            <div className="mockup-right-panel">
              <div className="panel-title">Explore Opportunities</div>

              <div className="panel-list-item">
                <div className="panel-item-icon purple">💼</div>
                <div className="panel-item-info">
                  <strong>Internships</strong>
                  <small>120+ openings</small>
                </div>
                <span className="panel-arrow">&gt;</span>
              </div>

              <div className="panel-list-item">
                <div className="panel-item-icon purple">📊</div>
                <div className="panel-item-info">
                  <strong>Jobs</strong>
                  <small>300+ openings</small>
                </div>
                <span className="panel-arrow">&gt;</span>
              </div>

              <div className="panel-list-item">
                <div className="panel-item-icon purple">🎓</div>
                <div className="panel-item-info">
                  <strong>Projects</strong>
                  <small>Find collaborators</small>
                </div>
                <span className="panel-arrow">&gt;</span>
              </div>
            </div>

          </div>
        </div>

      </main>


      {/* ========================================================
          2. COMMUNITY SECTION (#community)
          ======================================================== */}
      <section className="welcome-details-section" id="community">
        <div className="section-header-center">
          <span className="section-pill-tag">AU COMMUNITY NETWORK</span>
          <h2>Connect, Share & Grow with Students and Faculty</h2>
          <p>An interactive ecosystem for AU Foundation where students and professors interact, collaborate on research, and share posts.</p>
        </div>

        <div className="details-cards-grid">
          <div className="detail-card-item">
            <div className="detail-card-icon purple"><i className="fas fa-users-class"></i></div>
            <h3>Faculty & Student Directory</h3>
            <p>Search and discover community members by batch, role, or technical skills. Connect with fellow students and faculty members in one click.</p>
            <div className="detail-card-badge">Network System</div>
          </div>

          <div className="detail-card-item">
            <div className="detail-card-icon orange"><i className="fas fa-newspaper"></i></div>
            <h3>Community Feed & Posts</h3>
            <p>Share project announcements, ask doubts, and post images or videos directly from your local computer into the live AU feed.</p>
            <div className="detail-card-badge">Media Feed</div>
          </div>

          <div className="detail-card-item">
            <div className="detail-card-icon purple"><i className="fas fa-chalkboard-teacher"></i></div>
            <h3>Faculty Guidance</h3>
            <p>Receive course advice, project guidance, and office hours announcements directly from official AU faculty members.</p>
            <div className="detail-card-badge">Faculty Mentorship</div>
          </div>
        </div>
      </section>


      {/* ========================================================
          3. OPPORTUNITIES SECTION (#opportunities)
          ======================================================== */}
      <section className="welcome-details-section alt-bg" id="opportunities">
        <div className="section-header-center">
          <span className="section-pill-tag orange">CAREERS & PROJECTS</span>
          <h2>Unlock Exclusive Opportunities</h2>
          <p>Find research internships, teaching assistant roles, capstone projects, and industry full-time jobs posted by faculty and admins.</p>
        </div>

        <div className="details-cards-grid">
          <div className="detail-card-item">
            <div className="detail-card-icon orange"><i className="fas fa-briefcase"></i></div>
            <h3>Campus Internships & Jobs</h3>
            <p>Access active job listings filtered specifically for AU Foundation students with one-click applications.</p>
            <div className="detail-card-badge orange">Career Portal</div>
          </div>

          <div className="detail-card-item">
            <div className="detail-card-icon purple"><i className="fas fa-flask"></i></div>
            <h3>Faculty Research Labs</h3>
            <p>Apply for research lab assistant positions (RA) and collaborate with senior faculty on cutting-edge technical projects.</p>
            <div className="detail-card-badge">Research Lab</div>
          </div>

          <div className="detail-card-item">
            <div className="detail-card-icon orange"><i className="fas fa-project-diagram"></i></div>
            <h3>Capstone Projects</h3>
            <p>Team up with peers across different batches to build real-world software, AI models, and engineering solutions.</p>
            <div className="detail-card-badge orange">Collaborations</div>
          </div>
        </div>
      </section>


      {/* ========================================================
          4. EVENTS SECTION (#events)
          ======================================================== */}
      <section className="welcome-details-section" id="events">
        <div className="section-header-center">
          <span className="section-pill-tag">CAMPUS EVENTS & FESTS</span>
          <h2>Experience Vibrant Campus Life</h2>
          <p>From Dandiya Nights and Hackathons to Sports Leagues, stay updated and RSVP to university events in real-time.</p>
        </div>

        <div className="details-cards-grid">
          <div className="detail-card-item">
            <div className="detail-card-icon purple"><i className="fas fa-music"></i></div>
            <h3>Dandiya Nights & Cultural Fests</h3>
            <p>Join festive celebrations, DJ nights, cultural dance performances, and university annual gatherings with your peers.</p>
            <div className="detail-card-badge">Cultural Fest</div>
          </div>

          <div className="detail-card-item">
            <div className="detail-card-icon orange"><i className="fas fa-laptop-code"></i></div>
            <h3>Hackathons & Tech Contests</h3>
            <p>Participate in 24-hour coding hackathons, AI challenges, and innovation competitions hosted on campus.</p>
            <div className="detail-card-badge orange">Hackathons</div>
          </div>

          <div className="detail-card-item">
            <div className="detail-card-icon purple"><i className="fas fa-trophy"></i></div>
            <h3>Sports Leagues & Tournaments</h3>
            <p>Compete in intra-college Football, Cricket, Table Tennis, and Chess tournaments with live RSVP tracking.</p>
            <div className="detail-card-badge">Sports League</div>
          </div>
        </div>
      </section>


      {/* ========================================================
          5. ABOUT & STATS BANNER SECTION (#about)
          ======================================================== */}
      <section className="welcome-stats-container" id="about">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="section-pill-tag">ABOUT AU FOUNDATION</span>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginTop: '12px', color: '#ffffff' }}>Powering the AU Ecosystem</h2>
          <p style={{ color: '#aeb4cf', fontSize: '14px', maxWidth: '600px', margin: '8px auto 0' }}>Creating a transparent, vibrant, and empowering space for learning and networking.</p>
        </div>

        <div className="welcome-stats-banner">
          {/* Stat 1: Students */}
          <div className="stat-item-box">
            <div className="stat-icon purple-glow">👥</div>
            <div className="stat-meta">
              <strong>2,500+</strong>
              <span>Active Students</span>
            </div>
          </div>

          <div className="stat-divider-line"></div>

          {/* Stat 2: Faculty */}
          <div className="stat-item-box">
            <div className="stat-icon purple-glow">👨‍🏫</div>
            <div className="stat-meta">
              <strong>120+</strong>
              <span>Faculty Members</span>
            </div>
          </div>

          <div className="stat-divider-line"></div>

          {/* Stat 3: Opportunities */}
          <div className="stat-item-box">
            <div className="stat-icon purple-glow">💼</div>
            <div className="stat-meta">
              <strong>500+</strong>
              <span>Opportunities Shared</span>
            </div>
          </div>

          {/* Right Cursive Slogan */}
          <div className="stats-slogan-box">
            <span>Ignite</span>
            <span>Grow</span>
            <span className="highlight">Succeed</span>
          </div>
        </div>
      </section>


      {/* ========================================================
          FOOTER BAR
          ======================================================== */}
      <footer className="welcome-bottom-footer">
        <div className="footer-brand">
          <span className="brand-badge-au sm">AU</span>
          <div>
            <strong>FOUNDATION</strong>
            <span>Community Platform</span>
          </div>
        </div>

        <div className="footer-links">
          <a href="#home" onClick={(e) => scrollToSection(e, 'home')}>Home</a>
          <a href="#community" onClick={(e) => scrollToSection(e, 'community')}>Community</a>
          <a href="#opportunities" onClick={(e) => scrollToSection(e, 'opportunities')}>Opportunities</a>
          <a href="#events" onClick={(e) => scrollToSection(e, 'events')}>Events</a>
          <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
        </div>

        <div className="footer-tagline">
          Made with <span className="heart-icon">❤️</span> for AU Foundation
        </div>
      </footer>

    </div>
  );
}

export default Welcome;