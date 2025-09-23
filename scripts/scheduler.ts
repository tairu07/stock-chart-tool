#!/usr/bin/env node

import { CronJob } from 'cron';
import { ingestEOD } from './ingest-eod';
import { ingestIntraday } from './ingest-intraday';
import { updateSymbols } from './update-symbols';
import { runMaintenance } from './maintenance';

interface SchedulerConfig {
  timezone: string;
  jobs: {
    eod: string;           // EODデータ取得
    intraday: string;      // 日中データ更新
    symbols: string;       // 銘柄リスト更新
    maintenance: string;   // メンテナンス
  };
}

const config: SchedulerConfig = {
  timezone: 'Asia/Tokyo',
  jobs: {
    // 平日 16:00 にEODデータを取得
    eod: '0 0 16 * * 1-5',
    
    // 平日 11:35, 15:35 に日中データを更新
    intraday: '0 35 11,15 * * 1-5',
    
    // 毎週日曜日 2:00 に銘柄リストを更新
    symbols: '0 0 2 * * 0',
    
    // 毎月第1日曜日 3:00 にメンテナンス実行
    maintenance: '0 0 3 1-7 * 0',
  },
};

class StockDataScheduler {
  private jobs: CronJob[] = [];

  constructor(private config: SchedulerConfig) {}

  start() {
    console.log('Starting stock data scheduler...');
    console.log(`Timezone: ${this.config.timezone}`);

    // EODデータ取得ジョブ
    const eodJob = new CronJob(
      this.config.jobs.eod,
      async () => {
        console.log('Starting EOD data ingestion...');
        try {
          await ingestEOD();
          console.log('EOD data ingestion completed successfully');
        } catch (error) {
          console.error('EOD data ingestion failed:', error);
        }
      },
      null,
      true,
      this.config.timezone
    );

    // 日中データ更新ジョブ
    const intradayJob = new CronJob(
      this.config.jobs.intraday,
      async () => {
        console.log('Starting intraday data update...');
        try {
          await ingestIntraday();
          console.log('Intraday data update completed successfully');
        } catch (error) {
          console.error('Intraday data update failed:', error);
        }
      },
      null,
      true,
      this.config.timezone
    );

    // 銘柄リスト更新ジョブ
    const symbolsJob = new CronJob(
      this.config.jobs.symbols,
      async () => {
        console.log('Starting symbol list update...');
        try {
          await updateSymbols();
          console.log('Symbol list update completed successfully');
        } catch (error) {
          console.error('Symbol list update failed:', error);
        }
      },
      null,
      true,
      this.config.timezone
    );

    // メンテナンスジョブ
    const maintenanceJob = new CronJob(
      this.config.jobs.maintenance,
      async () => {
        console.log('Starting database maintenance...');
        try {
          await runMaintenance();
          console.log('Database maintenance completed successfully');
        } catch (error) {
          console.error('Database maintenance failed:', error);
        }
      },
      null,
      true,
      this.config.timezone
    );

    this.jobs = [eodJob, intradayJob, symbolsJob, maintenanceJob];

    console.log('Scheduler started with the following jobs:');
    console.log(`  EOD Data: ${this.config.jobs.eod}`);
    console.log(`  Intraday: ${this.config.jobs.intraday}`);
    console.log(`  Symbols: ${this.config.jobs.symbols}`);
    console.log(`  Maintenance: ${this.config.jobs.maintenance}`);
  }

  stop() {
    console.log('Stopping scheduler...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('Scheduler stopped');
  }

  getStatus() {
    return {
      running: this.jobs.length > 0,
      jobs: this.jobs.map((job, index) => ({
        name: ['eod', 'intraday', 'symbols', 'maintenance'][index],
        running: job.running,
        nextDate: job.nextDate()?.toISOString(),
      })),
    };
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  const scheduler = new StockDataScheduler(config);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  scheduler.start();

  // ステータス表示
  setInterval(() => {
    const status = scheduler.getStatus();
    console.log('Scheduler status:', JSON.stringify(status, null, 2));
  }, 60000); // 1分ごと
}

export { StockDataScheduler, config as defaultConfig };
