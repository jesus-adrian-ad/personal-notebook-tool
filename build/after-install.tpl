#!/bin/bash

if type update-alternatives 2>/dev/null >&1; then
    # Remove previous link if it doesn't use update-alternatives
    if [ -L '/usr/bin/${executable}' -a -e '/usr/bin/${executable}' -a "`readlink '/usr/bin/${executable}'`" != '/etc/alternatives/${executable}' ]; then
        rm -f '/usr/bin/${executable}'
    fi
    update-alternatives --install '/usr/bin/${executable}' '${executable}' '/opt/${sanitizedProductName}/${executable}' 100 || ln -sf '/opt/${sanitizedProductName}/${executable}' '/usr/bin/${executable}'
else
    ln -sf '/opt/${sanitizedProductName}/${executable}' '/usr/bin/${executable}'
fi

# Always set the SUID sandbox bit, instead of electron-builder's default
# `unshare --user true` check: on Ubuntu 24.04+/26.04, AppArmor restricts
# unprivileged user namespaces for unlisted binaries at runtime even when
# that check (run as root during install) reports namespaces as usable,
# so trusting it here leaves chrome-sandbox at 0755 and Chromium refuses to
# start ("SUID sandbox helper binary was found, but is not configured
# correctly"). Forcing 4755 unconditionally works on every kernel.
chown root:root '/opt/${sanitizedProductName}/chrome-sandbox' || true
chmod 4755 '/opt/${sanitizedProductName}/chrome-sandbox' || true

if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi
