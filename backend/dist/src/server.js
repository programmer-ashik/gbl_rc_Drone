import 'dotenv/config';
import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './loaders/mongoose.loader.js';
import { connectRedis } from './core/cache/redis.js';
import { migrateLegacyCategories } from './api/v1/categories/navigation.service.js';
import { initRealtime } from './core/realtime/hub.js';
import { ensureCmsDefaults } from './api/v1/cms/cms.service.js';
const bootstrap = async () => {
    await connectDatabase();
    await connectRedis();
    await migrateLegacyCategories();
    await ensureCmsDefaults();
    const app = createApp();
    const server = http.createServer(app);
    initRealtime(server);
    server.listen(config.PORT, () => {
        console.log(`scaffold-backend listening on :${config.PORT}`);
    });
};
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
