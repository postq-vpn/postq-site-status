// Server-safe: no React imports, so pages (server components) can inline the script.

export const RD_THEME_ATTR = 'data-rd-theme'
export const RD_THEME_STORAGE_KEY = 'rd-theme'

/** Runs inline before first paint: stored choice, else the OS preference. */
export const RD_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${RD_THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('${RD_THEME_ATTR}',t)}catch(e){}})()`