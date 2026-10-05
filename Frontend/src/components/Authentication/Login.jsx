import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import "../../styles/Authentication/login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", formData);
      const data = response.data;

      // Assuming backend returns { token, user: { ... } } or similar
      localStorage.setItem("au_token", data.token);
      localStorage.setItem("au_user", JSON.stringify(data.user || data.data?.user || {}));

      const role = (data.user?.role || data.data?.user?.role || "student").toLowerCase();

      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "teacher") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* LEFT BRAND SECTION */}
      <section className="auth-brand-section">

        <div className="auth-brand">

          <div className="auth-logo">
            A
          </div>

          <div>
            <h2>AU Community</h2>
            <span>Learn • Connect • Grow</span>
          </div>

        </div>

        <div className="auth-brand-content">

          <span className="auth-small-label">
            AU FOUNDATION COMMUNITY
          </span>

          <h1>
            Your community.
            <br />
            <span>Your growth.</span>
          </h1>

          <p>
            Connect with students, mentors and industry experts.
            Learn new skills, discover opportunities and build
            your professional network.
          </p>

          <div className="auth-feature-list">

            <div>
              <span className="feature-icon">✓</span>
              <div>
                <strong>Learn Together</strong>
                <p>Access courses and study resources.</p>
              </div>
            </div>

            <div>
              <span className="feature-icon">✓</span>
              <div>
                <strong>Build Connections</strong>
                <p>Connect with peers and mentors.</p>
              </div>
            </div>

            <div>
              <span className="feature-icon">✓</span>
              <div>
                <strong>Discover Opportunities</strong>
                <p>Find internships and career opportunities.</p>
              </div>
            </div>

          </div>

        </div>

        <div className="auth-brand-footer">
          © 2026 AU Community
        </div>

      </section>


      {/* RIGHT LOGIN SECTION */}
      <section className="auth-form-section">

        <div className="auth-form-container">

          <div className="mobile-auth-brand">
            <div className="auth-logo">A</div>
            <strong>AU Community</strong>
          </div>

          <div className="auth-heading">

            <span className="auth-welcome">
              WELCOME BACK
            </span>

            <h1>Sign in to your account</h1>

            <p>
              Continue your learning journey with AU Community.
            </p>

          </div>

          {error && <div className="auth-error" style={{ color: 'red', background: '#ffebeb', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}
            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  @
                </span>

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  •••
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* OPTIONS */}
            <div className="auth-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span>
                  Remember me
                </span>

              </label>

              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>

            </div>


            {/* LOGIN */}
            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span>→</span>}
            </button>

          </form>


          {/* DIVIDER */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>


          {/* GOOGLE */}
          <button className="google-button">
            <span className="google-icon">
              G
            </span>

            Continue with Google
          </button>


          {/* REGISTER */}
          <p className="auth-bottom-text">
            Don't have an account?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>

          <p className="auth-terms">
            By continuing, you agree to our
            <Link to="/terms"> Terms of Service </Link>
            and
            <Link to="/privacy"> Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;