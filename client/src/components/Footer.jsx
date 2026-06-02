import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
} from "react-icons/fa";
import logo from "../assets/images/logo.png";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-main">
        <div className="site-footer-grid">
          <div className="site-footer-col">
            <div className="site-footer-brand-wrap">
              <img src={logo} alt="VR BITES logo" className="site-footer-logo" />
              <h5 className="site-footer-brand mb-0">VR BITES</h5>
            </div>
            <p className="site-footer-desc mb-0">
              Experience delicious food, premium dining, and unforgettable moments at VR BITES.
            </p>
          </div>

          <div className="site-footer-col">
            <h6 className="site-footer-heading">Quick Links</h6>
            <nav className="site-footer-links" aria-label="Footer quick links">
              <Link to="/our-story">Our Story</Link>
              <Link to="/offers">Special Offers</Link>
              <Link to="/chef-specials">Chef&apos;s Specials</Link>
              <Link to="/careers">Careers</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms">Terms &amp; Conditions</Link>
            </nav>
          </div>

          <div className="site-footer-col">
            <h6 className="site-footer-heading">Contact Information</h6>
            <ul className="site-footer-contact list-unstyled mb-0">
              <li>
                <FaEnvelope aria-hidden="true" />
                <a href="mailto:vrbitesrestaurant@gmail.com">vrbitesrestaurant@gmail.com</a>
              </li>
              <li>
                <FaMapMarkerAlt aria-hidden="true" />
                <span>New Delhi, India</span>
              </li>
              <li>
                <FaPhoneAlt aria-hidden="true" />
                <span>+91 87452 39106</span>
              </li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h6 className="site-footer-heading">Social Media</h6>
            <div className="site-footer-social" aria-label="Social links">
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <FaYoutube />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <div className="container site-footer-bottom-content">
          <p className="mb-0">© 2026 VR BITES. All rights reserved.</p>
          <p className="mb-0">Designed by Vivek Sasumahanthi</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
