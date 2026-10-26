import MotherCount from '../models/MotherCount.js';

/**
 * One MotherCount document per counter. Milkimom keeps the original
 * 'satisfied_mothers' key; MilkReady's "Mother ইতোমধ্যে MilkReady অর্ডার
 * করেছেন" counter has its own key and seed.
 */
const COUNTERS = {
  milkimom: { key: 'satisfied_mothers', defaultCount: 89746 },
  milkready: { key: 'milkready_orders', defaultCount: 14022 },
};

const getCounterStats = (product) => {
  const { key, defaultCount } = COUNTERS[product];
  return MotherCount.getStats(key, defaultCount);
};

const makeGetCount = (product) => async (req, res, next) => {
  try {
    const stats = await getCounterStats(product);
    // The count only moves on a cron tick, so let the Next.js route handler and
    // any CDN in front of it hold the answer instead of re-querying per visitor.
    res.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    );
    res.json({
      success: true,
      data: {
        count: stats.count,
        lastUpdated: stats.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

const makeUpdateCount = (product) => async (req, res, next) => {
  try {
    const { count, increment } = req.body;
    const stats = await getCounterStats(product);

    if (typeof count === 'number') {
      stats.count = count;
    } else if (typeof increment === 'number') {
      stats.count += increment;
      stats.history.push({
        increment,
        newCount: stats.count,
        updatedAt: new Date(),
      });
    }

    stats.lastUpdated = new Date();
    await stats.save();

    res.json({
      success: true,
      message: 'Mother count updated successfully',
      data: {
        count: stats.count,
        lastUpdated: stats.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current mother count
 * GET /api/stats/mother-count
 */
export const getMotherCount = makeGetCount('milkimom');

/**
 * Manually update mother count or trigger increment
 * PUT /api/stats/mother-count
 */
export const updateMotherCount = makeUpdateCount('milkimom');

/**
 * Get current MilkReady order count
 * GET /api/stats/milkready-count
 */
export const getMilkreadyCount = makeGetCount('milkready');

/**
 * Manually update MilkReady order count or trigger increment
 * PUT /api/stats/milkready-count
 */
export const updateMilkreadyCount = makeUpdateCount('milkready');

/**
 * Executes random increment logic (min-max inclusive, default 200-500)
 */
export const incrementMotherCountRandomly = async ({ product = 'milkimom', min = 200, max = 500 } = {}) => {
  const randomIncrement = Math.floor(Math.random() * (max - min + 1)) + min;

  const stats = await getCounterStats(product);
  stats.count += randomIncrement;
  stats.lastUpdated = new Date();
  stats.history.push({
    increment: randomIncrement,
    newCount: stats.count,
    updatedAt: new Date(),
  });

  await stats.save();
  console.log(
    `[CronJob] Updated ${product} count: +${randomIncrement} -> Total count: ${stats.count} at ${new Date().toISOString()}`
  );

  return stats;
};
