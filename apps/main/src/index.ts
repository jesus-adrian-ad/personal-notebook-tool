import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createMainWindow } from './window';
import { VaultService } from './services/vault.service';
import { NotesService } from './services/notes.service';
import { AppSettingsService } from './services/app-settings.service';
import { AttachmentsService } from './services/attachments.service';
import { UrlPreviewService } from './services/url-preview.service';
import { registerVaultIpc } from './ipc/vault.ipc';
import { registerNotesIpc } from './ipc/notes.ipc';
import { registerSearchIpc } from './ipc/search.ipc';
import { registerAttachmentsIpc } from './ipc/attachments.ipc';
import { registerUrlPreviewIpc } from './ipc/url-preview.ipc';

// Silences Chromium's GPU/VSync console noise (gl_surface_presentation_helper,
// "GetVSyncParametersIfAvailable() failed") common on Linux GPU drivers and
// virtualized displays — this is a text-editing app with no need for GPU
// compositing, so trading it away costs nothing in practice.
app.disableHardwareAcceleration();

const vaultService = new VaultService();
const notesService = new NotesService(vaultService);
const appSettingsService = new AppSettingsService();
const attachmentsService = new AttachmentsService(vaultService);
const urlPreviewService = new UrlPreviewService(vaultService);

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.notebook.app');

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerVaultIpc(vaultService, appSettingsService);
  registerNotesIpc(notesService);
  registerSearchIpc(vaultService);
  registerAttachmentsIpc(attachmentsService);
  registerUrlPreviewIpc(urlPreviewService);

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
