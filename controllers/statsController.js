import MotherCount from '../models/MotherCount.js';

/**
 * Get current mother count
 * GET /api/stats/mother-count
 */
export const getMotherCount = async (req, res, next) => {
  try {
    const stats = await MotherCount.getStats();
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

/**
 * Manually update mother count or trigger increment
 * PUT /api/stats/mother-count
 */
export const updateMotherCount = async (req, res, next) => {
  try {
    const { count, increment } = req.body;
    const stats = await MotherCount.getStats();

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
 * Executes random increment logic (200-500)
 */
export const incrementMotherCountRandomly = async () => {
  const min = 200;
  const max = 500;
  const randomIncrement = Math.floor(Math.random() * (max - min + 1)) + min;

  const stats = await MotherCount.getStats();
  stats.count += randomIncrement;
  stats.lastUpdated = new Date();
  stats.history.push({
    increment: randomIncrement,
    newCount: stats.count,
    updatedAt: new Date(),
  });

  await stats.save();
  console.log(
    `[CronJob] Updated mother count: +${randomIncrement} -> Total count: ${stats.count} at ${new Date().toISOString()}`
  );

  return stats;
};
