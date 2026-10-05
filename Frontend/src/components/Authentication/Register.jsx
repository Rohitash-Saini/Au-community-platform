import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import "../../styles/Authentication/register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);

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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      // Backend expects specific fields based on controllers
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };

      const response = await API.post("/auth/register", payload);
      const data = response.data;

      // Usually after registration, you auto-login or redirect to login
      if (data.token) {
        localStorage.setItem("au_token", data.token);
        localStorage.setItem("au_user", JSON.stringify(data.user || data.data?.user || {}));
        const role = data.user?.role || data.data?.user?.role || "student";
        if (role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        // If no token, just redirect to login
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">


      {/* ================= LEFT BRAND ================= */}

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
            JOIN AU COMMUNITY
          </span>

          <h1>
            Start your
            <br />
            <span>journey today.</span>
          </h1>

          <p>
            Create your AU Community account and become
            part of a growing network of students, faculty
            and professionals.
          </p>


          <div className="auth-feature-list">

            <div>
              <span className="feature-icon">
                ✓
              </span>

              <div>
                <strong>Learn</strong>
                <p>
                  Courses, resources and learning paths.
                </p>
              </div>
            </div>


            <div>
              <span className="feature-icon">
                ✓
              </span>

              <div>
                <strong>Connect</strong>
                <p>
                  Build meaningful student connections.
                </p>
              </div>
            </div>


            <div>
              <span className="feature-icon">
                ✓
              </span>

              <div>
                <strong>Grow</strong>
                <p>
                  Discover internships and career opportunities.
                </p>
              </div>
            </div>

          </div>

        </div>


        <div className="auth-brand-footer">
          © 2026 AU Community
        </div>

      </section>


      {/* ================= REGISTER FORM ================= */}

      <section className="auth-form-section">

        <div className="auth-form-container register-container">

          <div className="mobile-auth-brand">

            <div className="auth-logo">
              A
            </div>

            <strong>
              AU Community
            </strong>

          </div>


          <div className="auth-heading">

            <span className="auth-welcome">
              GET STARTED
            </span>

            <h1>
              Create your account
            </h1>

            <p>
              Join AU Community and start building your future.
            </p>

          </div>

          {error && <div className="auth-error" style={{ color: 'red', background: '#ffebeb', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >


            {/* NAME */}

            <div className="form-group">

              <label htmlFor="name">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ◎
                </span>

                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
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


            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  •••
                </span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength="6"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* TERMS */}

            <label className="terms-checkbox">

              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) =>
                  setAgreeTerms(e.target.checked)
                }
              />

              <span>
                I agree to the{" "}
                <Link to="/terms">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy">
                  Privacy Policy
                </Link>
              </span>

            </label>


            {/* REGISTER BUTTON */}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
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


          {/* LOGIN */}

          <p className="auth-bottom-text">

            Already have an account?

            <Link to="/login">
              Sign in
            </Link>

          </p>

        </div>

      </section>

    </div>
  );
}

export default Register;