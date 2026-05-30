/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TranslitDirection = 'toLatin' | 'toCyrillic';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  downloadUrl?: string;
  outputFileName?: string;
  originalFile: File;
}

export type ActiveTab = 'files' | 'text';
