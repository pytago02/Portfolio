/**
 * contact-form.js
 * Thêm đoạn script này vào cuối <body> của index.html
 * để kết nối form liên hệ với backend API.
 *
 * CÁCH SỬ DỤNG:
 * 1. Đặt file này vào thư mục public/
 * 2. Thêm vào index.html trước </body>:
 *    <script src="contact-form.js"></script>
 *
 * HOẶC copy trực tiếp đoạn code dưới vào <script> cuối index.html
 */

(function() {
  'use strict';

  const API_BASE = ''; // Same origin. Nếu deploy riêng, thay bằng 'https://your-api.com'

  // ── Track page view ──────────────────────────────────────────────
  function trackPageView() {
    fetch(API_BASE + '/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {}); // Silent fail
  }

  // Track on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  // ── Contact Form ─────────────────────────────────────────────────
  function initContactForm() {
    // Inject the form HTML into the contact section
    const contactRight = document.querySelector('.contact-right');
    if (!contactRight) return;

    // Add form above the contact-row items
    const formHTML = `
      <form id="contact-form" novalidate>
        <div class="cf-row">
          <div class="cf-field">
            <label class="cf-label">Tên của bạn *</label>
            <input class="cf-input" type="text" id="cf-name" name="name" placeholder="Nguyễn Văn A" autocomplete="name">
            <div class="cf-error" id="cf-name-error"></div>
          </div>
          <div class="cf-field">
            <label class="cf-label">Email *</label>
            <input class="cf-input" type="email" id="cf-email" name="email" placeholder="you@example.com" autocomplete="email">
            <div class="cf-error" id="cf-email-error"></div>
          </div>
        </div>
        <div class="cf-field">
          <label class="cf-label">Chủ đề</label>
          <input class="cf-input" type="text" id="cf-subject" name="subject" placeholder="Cơ hội hợp tác, dự án freelance...">
        </div>
        <div class="cf-field">
          <label class="cf-label">Tin nhắn *</label>
          <textarea class="cf-input cf-textarea" id="cf-message" name="message" rows="5" placeholder="Xin chào Khánh, tôi muốn..."></textarea>
          <div class="cf-error" id="cf-message-error"></div>
        </div>
        <button type="submit" class="cf-submit" id="cf-submit">
          <span id="cf-btn-text">Gửi tin nhắn →</span>
          <span id="cf-btn-loading" style="display:none">Đang gửi...</span>
        </button>
        <div id="cf-success" class="cf-success" style="display:none">
          ✓ Tin nhắn đã được gửi! Tôi sẽ phản hồi trong 24–48 giờ.
        </div>
        <div id="cf-error-global" class="cf-error-global" style="display:none"></div>
      </form>

      <style>
        .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .cf-field { margin-bottom: 14px; }
        .cf-label {
          display: block; font-family: var(--ff-ui);
          font-size: 9px; font-weight: 600; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--ink3); margin-bottom: 6px;
        }
        .cf-input {
          width: 100%; padding: 11px 14px;
          border: 1px solid var(--border); background: var(--white);
          font-family: var(--ff-body); font-size: 14px; color: var(--ink);
          outline: none; transition: border-color 0.2s;
          resize: none;
        }
        .cf-input:focus { border-color: var(--red); }
        .cf-input.invalid { border-color: #dc2626; }
        .cf-textarea { min-height: 120px; }
        .cf-error { font-family: var(--ff-ui); font-size: 10px; color: #dc2626; margin-top: 4px; min-height: 14px; }
        .cf-error-global {
          font-family: var(--ff-ui); font-size: 11px; color: #dc2626;
          padding: 10px 14px; border: 1px solid rgba(220,38,38,0.3);
          background: rgba(220,38,38,0.05); margin-top: 12px;
        }
        .cf-success {
          font-family: var(--ff-ui); font-size: 11px; letter-spacing: 0.06em;
          color: #15803d; padding: 14px;
          border: 1px solid rgba(21,128,61,0.3);
          background: rgba(21,128,61,0.05); margin-top: 12px;
        }
        .cf-submit {
          width: 100%; padding: 14px;
          background: var(--ink); color: var(--white); border: none; cursor: pointer;
          font-family: var(--ff-ui); font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          transition: background 0.2s, transform 0.2s;
          margin-top: 4px;
        }
        .cf-submit:hover:not(:disabled) { background: var(--red); transform: translateY(-1px); }
        .cf-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        @media(max-width:600px) { .cf-row { grid-template-columns: 1fr; } }
      </style>
    `;

    // Insert form before existing contact rows
    const firstRow = contactRight.querySelector('.contact-row');
    if (firstRow) {
      firstRow.insertAdjacentHTML('beforebegin', formHTML);
    } else {
      contactRight.insertAdjacentHTML('afterbegin', formHTML);
    }

    // ── Form submission ──
    document.getElementById('contact-form').addEventListener('submit', async function(e) {
      e.preventDefault();

      const name    = document.getElementById('cf-name').value.trim();
      const email   = document.getElementById('cf-email').value.trim();
      const subject = document.getElementById('cf-subject').value.trim();
      const message = document.getElementById('cf-message').value.trim();

      // Clear errors
      clearErrors();

      // Client-side validation
      let valid = true;
      if (name.length < 2) {
        setError('cf-name', 'Tên phải có ít nhất 2 ký tự');
        valid = false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('cf-email', 'Địa chỉ email không hợp lệ');
        valid = false;
      }
      if (message.length < 10) {
        setError('cf-message', 'Tin nhắn phải có ít nhất 10 ký tự');
        valid = false;
      }
      if (!valid) return;

      // Submit
      setLoading(true);

      try {
        const res = await fetch(API_BASE + '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message }),
        });

        const data = await res.json();

        if (data.success) {
          document.getElementById('cf-success').style.display = 'block';
          document.getElementById('contact-form').reset();
          // Hide form after success
          setTimeout(() => {
            document.getElementById('contact-form').style.opacity = '0.5';
            document.getElementById('contact-form').style.pointerEvents = 'none';
          }, 500);
        } else if (data.errors) {
          // Field-level errors from server
          if (data.errors.name)    setError('cf-name', data.errors.name);
          if (data.errors.email)   setError('cf-email', data.errors.email);
          if (data.errors.message) setError('cf-message', data.errors.message);
        } else {
          document.getElementById('cf-error-global').style.display = 'block';
          document.getElementById('cf-error-global').textContent = data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
        }
      } catch (err) {
        document.getElementById('cf-error-global').style.display = 'block';
        document.getElementById('cf-error-global').textContent = 'Không thể kết nối máy chủ. Vui lòng thử lại sau.';
      } finally {
        setLoading(false);
      }
    });

    function setError(fieldId, msg) {
      document.getElementById(fieldId + '-error').textContent = msg;
      document.getElementById(fieldId)?.classList.add('invalid');
    }

    function clearErrors() {
      document.querySelectorAll('.cf-error').forEach(el => el.textContent = '');
      document.querySelectorAll('.cf-input').forEach(el => el.classList.remove('invalid'));
      document.getElementById('cf-error-global').style.display = 'none';
      document.getElementById('cf-success').style.display = 'none';
    }

    function setLoading(loading) {
      const btn = document.getElementById('cf-submit');
      btn.disabled = loading;
      document.getElementById('cf-btn-text').style.display = loading ? 'none' : '';
      document.getElementById('cf-btn-loading').style.display = loading ? '' : 'none';
    }
  }

  // Init after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }

})();
