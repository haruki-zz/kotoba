import { FastifyInstance } from 'fastify';

import {
  AppSettingsPatchInput,
  settingsDatabaseBackupResponseSchema,
  settingsExportResponseSchema,
  settingsImportRequestSchema,
  settingsResetRequestSchema,
  settingsSnapshotSchema,
  settingsUpdateRequestSchema,
} from '@shared/types';

import { AppContext } from '../context';
import { BadRequestError } from '../errors';

const includesSensitivePatch = (patch: AppSettingsPatchInput) =>
  Boolean(
    patch.privacy &&
      (patch.privacy.allowNetwork !== undefined ||
        patch.privacy.telemetryEnabled !== undefined ||
        patch.privacy.aiRequestLogging !== undefined)
  );

export const registerSettingsRoutes = (app: FastifyInstance, ctx: AppContext) => {
  app.get(
    '/api/settings',
    {
      schema: {
        response: {
          200: settingsSnapshotSchema,
        },
      },
    },
    async () => ctx.services.settingsService.getSnapshot()
  );

  app.patch(
    '/api/settings',
    {
      schema: {
        body: settingsUpdateRequestSchema,
        response: {
          200: settingsSnapshotSchema,
        },
      },
    },
    async (request) => {
      if (includesSensitivePatch(request.body.patch) && !request.body.confirmSensitive) {
        throw new BadRequestError('Sensitive privacy changes require explicit confirmation');
      }

      return ctx.services.settingsService.update(request.body.patch);
    }
  );

  app.post(
    '/api/settings/reset',
    {
      schema: {
        body: settingsResetRequestSchema,
        response: {
          200: settingsSnapshotSchema,
        },
      },
    },
    async () => ctx.services.settingsService.reset()
  );

  app.get(
    '/api/settings/export',
    {
      schema: {
        response: {
          200: settingsExportResponseSchema,
        },
      },
    },
    async () => ctx.services.settingsService.exportSettings()
  );

  app.post(
    '/api/settings/import',
    {
      schema: {
        body: settingsImportRequestSchema,
        response: {
          200: settingsSnapshotSchema,
        },
      },
    },
    async (request) => {
      try {
        return ctx.services.settingsService.importSettings(request.body.backup);
      } catch (error) {
        throw new BadRequestError((error as Error).message);
      }
    }
  );

  app.post(
    '/api/settings/backup',
    {
      schema: {
        response: {
          200: settingsDatabaseBackupResponseSchema,
        },
      },
    },
    async () => {
      try {
        return await ctx.services.settingsService.backupDatabase();
      } catch (error) {
        throw new BadRequestError((error as Error).message);
      }
    }
  );
};
