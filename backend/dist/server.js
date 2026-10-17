import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './loaders/mongoose.loader.js';
const bootstrap = async () => {
    await connectDatabase();
    const app = createApp();
    app.listen(config.PORT, () => {
        console.log(`scaffold-backend listening on :${config.PORT}`);
    });
};
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map