/**
 * Google Identity Services & Google OAuth Authentication Utility
 * Powers official Google / Gmail Sign-In on AniCart
 */

// Decode JWT without external dependencies
export const parseJwt = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Error parsing JWT:', e.message);
    return null;
  }
};

// Retrieve configured Google Client ID from environment or local storage
export const getGoogleClientId = () => {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem('anicart_google_client_id') ||
    ''
  ).trim();
};

export const setGoogleClientId = (id) => {
  if (id && id.trim()) {
    localStorage.setItem('anicart_google_client_id', id.trim());
  } else {
    localStorage.removeItem('anicart_google_client_id');
  }
};

// Initialize Google Identity Services
export const initGoogleIdentity = (clientId, onCredentialSuccess) => {
  if (typeof window === 'undefined') return false;
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    return false;
  }

  const activeClientId = clientId || getGoogleClientId();
  if (!activeClientId) return false;

  try {
    window.google.accounts.id.initialize({
      client_id: activeClientId,
      callback: (response) => {
        if (response && response.credential) {
          const decoded = parseJwt(response.credential);
          onCredentialSuccess({
            credential: response.credential,
            email: decoded?.email,
            name: decoded?.name,
            avatar: decoded?.picture,
            googleId: decoded?.sub,
          });
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    return true;
  } catch (err) {
    console.warn('Google Identity Services initialization failed:', err.message);
    return false;
  }
};

// Render official Google branded button
export const renderGoogleButton = (elementId, options = {}) => {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) return false;
  const target = document.getElementById(elementId);
  if (!target) return false;

  try {
    target.innerHTML = '';
    window.google.accounts.id.renderButton(target, {
      theme: options.theme || 'filled_black',
      size: options.size || 'large',
      text: options.text || 'continue_with',
      shape: options.shape || 'pill',
      width: options.width || 320,
      logo_alignment: 'left',
    });
    return true;
  } catch (err) {
    console.warn('Failed to render official Google button:', err.message);
    return false;
  }
};

// Trigger Google OAuth2 Popup flow
export const triggerGooglePopup = (clientId, onSuccess, onError) => {
  const activeClientId = clientId || getGoogleClientId();

  if (!activeClientId) {
    if (onError) onError(new Error('NO_CLIENT_ID'));
    return;
  }

  if (window.google?.accounts?.oauth2) {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              // Fetch authenticated Google profile
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              if (profile && profile.email) {
                onSuccess({
                  email: profile.email,
                  name: profile.name,
                  avatar: profile.picture,
                  googleId: profile.sub,
                  accessToken: tokenResponse.access_token,
                });
                return;
              }
              throw new Error('Could not retrieve Google profile');
            } catch (fetchErr) {
              if (onError) onError(fetchErr);
            }
          } else if (tokenResponse?.error) {
            if (onError) onError(new Error(tokenResponse.error));
          }
        },
        error_callback: (err) => {
          if (onError) onError(err);
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (e) {
      console.warn('OAuth2 token client error:', e.message);
    }
  }

  // Fallback: One-Tap prompt
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        if (onError) onError(new Error('Google prompt was closed or suppressed by browser.'));
      }
    });
  } else {
    if (onError) onError(new Error('Google Identity Services SDK is not loaded.'));
  }
};
