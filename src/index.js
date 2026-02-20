import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  getLatestScores,
  getHistoricalScores,
  searchWines,
  getScoresByVintage,
  getScoresByColor,
  getScoresByWineId,
  getScoresByLwin,
  getTopRated
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API token not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  globalwinescore config set --api-token YOUR_TOKEN'));
    console.log('\nGet your API token at: https://www.globalwinescore.com/');
    process.exit(1);
  }
}

function formatWineResult(wine) {
  return {
    wine_name: wine.wine_name || wine.wine || 'N/A',
    vintage: wine.vintage || 'NV',
    score: wine.score || 'N/A',
    confidence: wine.confidence_index || 'N/A',
    appellation: wine.appellation || 'N/A',
    color: wine.color || 'N/A'
  };
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('globalwinescore')
  .description(chalk.bold('GlobalWineScore CLI') + ' - Wine ratings and scores from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-token <token>', 'GlobalWineScore API token')
  .action((options) => {
    if (options.apiToken) {
      setConfig('apiToken', options.apiToken);
      printSuccess('API token set');
    } else {
      printError('No options provided. Use --api-token');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiToken = getConfig('apiToken');
    console.log(chalk.bold('\nGlobalWineScore CLI Configuration\n'));
    console.log('API Token: ', apiToken ? chalk.green(apiToken.substring(0, 8) + '...' + apiToken.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// LATEST
// ============================================================

program
  .command('latest')
  .description('Get latest wine scores')
  .option('--wine-id <id>', 'Filter by wine ID')
  .option('--vintage <year>', 'Filter by vintage year')
  .option('--color <color>', 'Filter by color (red, white, pink)')
  .option('--lwin <lwin>', 'Filter by L-WIN identifier')
  .option('--lwin-11 <lwin11>', 'Filter by L-WIN 11 identifier')
  .option('--primeurs', 'Show only en primeur scores')
  .option('--limit <n>', 'Number of results (default: 20)', '20')
  .option('--ordering <field>', 'Sort order (score, -score, date, -date)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const filters = {
        limit: parseInt(options.limit),
      };

      if (options.wineId) filters.wine_id = options.wineId;
      if (options.vintage) filters.vintage = options.vintage;
      if (options.color) filters.color = options.color;
      if (options.lwin) filters.lwin = options.lwin;
      if (options.lwin11) filters.lwin_11 = options.lwin11;
      if (options.primeurs) filters.is_primeurs = true;
      if (options.ordering) filters.ordering = options.ordering;

      const data = await withSpinner('Fetching latest wine scores...', () => getLatestScores(filters));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nLatest GlobalWineScores\n'));

      const results = data.results || [];
      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' }
      ]);

      if (data.count > results.length) {
        console.log(chalk.dim(`\nShowing ${results.length} of ${data.count} total results`));
        console.log(chalk.dim('Use --limit or --json for more results'));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// VINTAGE
// ============================================================

program
  .command('vintage <year>')
  .description('Get scores by vintage year')
  .option('--color <color>', 'Filter by color (red, white, pink)')
  .option('--limit <n>', 'Number of results (default: 30)', '30')
  .option('--json', 'Output as JSON')
  .action(async (year, options) => {
    requireAuth();

    try {
      const filters = {
        limit: parseInt(options.limit),
        ordering: '-score'
      };

      if (options.color) filters.color = options.color;

      const data = await withSpinner(`Fetching ${year} vintage scores...`, () =>
        getScoresByVintage(year, filters)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\n${year} Vintage Scores\n`));

      const results = data.results || [];
      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' },
        { key: 'color', label: 'Color' }
      ]);

      if (data.count > results.length) {
        console.log(chalk.dim(`\nShowing ${results.length} of ${data.count} total results`));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// COLOR
// ============================================================

program
  .command('color <type>')
  .description('Get scores by wine color (red, white, pink)')
  .option('--vintage <year>', 'Filter by vintage year')
  .option('--limit <n>', 'Number of results (default: 30)', '30')
  .option('--json', 'Output as JSON')
  .action(async (type, options) => {
    requireAuth();

    const validColors = ['red', 'white', 'pink'];
    if (!validColors.includes(type.toLowerCase())) {
      printError(`Invalid color. Must be one of: ${validColors.join(', ')}`);
      process.exit(1);
    }

    try {
      const filters = {
        limit: parseInt(options.limit),
        ordering: '-score'
      };

      if (options.vintage) filters.vintage = options.vintage;

      const data = await withSpinner(`Fetching ${type} wine scores...`, () =>
        getScoresByColor(type, filters)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\n${type.charAt(0).toUpperCase() + type.slice(1)} Wine Scores\n`));

      const results = data.results || [];
      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' }
      ]);

      if (data.count > results.length) {
        console.log(chalk.dim(`\nShowing ${results.length} of ${data.count} total results`));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// TOP RATED
// ============================================================

program
  .command('top')
  .description('Get top-rated wines')
  .option('--color <color>', 'Filter by color (red, white, pink)')
  .option('--vintage <year>', 'Filter by vintage year')
  .option('--limit <n>', 'Number of results (default: 20)', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const filters = {
        limit: parseInt(options.limit)
      };

      if (options.color) filters.color = options.color;
      if (options.vintage) filters.vintage = options.vintage;

      const data = await withSpinner('Fetching top-rated wines...', () => getTopRated(filters));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nTop-Rated Wines\n'));

      const results = data.results || [];
      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' },
        { key: 'color', label: 'Color' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// WINE ID
// ============================================================

program
  .command('wine <id>')
  .description('Get scores for a specific wine by ID')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching wine ${id}...`, () => getScoresByWineId(id));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nWine ID: ${chalk.cyan(id)}\n`));

      const results = data.results || [];
      if (results.length === 0) {
        console.log(chalk.yellow('No wine found with this ID.'));
        return;
      }

      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' },
        { key: 'color', label: 'Color' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// LWIN
// ============================================================

program
  .command('lwin <identifier>')
  .description('Get scores by L-WIN identifier')
  .option('--json', 'Output as JSON')
  .action(async (identifier, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching L-WIN ${identifier}...`, () => getScoresByLwin(identifier));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nL-WIN: ${chalk.cyan(identifier)}\n`));

      const results = data.results || [];
      if (results.length === 0) {
        console.log(chalk.yellow('No wine found with this L-WIN.'));
        return;
      }

      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' },
        { key: 'color', label: 'Color' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// HISTORICAL (requires business plan)
// ============================================================

program
  .command('historical')
  .description('Get historical score data (requires business plan)')
  .option('--wine-id <id>', 'Filter by wine ID')
  .option('--vintage <year>', 'Filter by vintage year')
  .option('--limit <n>', 'Number of results (default: 20)', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const filters = {
        limit: parseInt(options.limit)
      };

      if (options.wineId) filters.wine_id = options.wineId;
      if (options.vintage) filters.vintage = options.vintage;

      const data = await withSpinner('Fetching historical scores...', () => getHistoricalScores(filters));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nHistorical GlobalWineScores\n'));

      const results = data.results || [];
      const formatted = results.map(formatWineResult);

      printTable(formatted, [
        { key: 'wine_name', label: 'Wine' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'score', label: 'Score', format: (v) => chalk.green(v) },
        { key: 'confidence', label: 'Confidence' },
        { key: 'appellation', label: 'Appellation' }
      ]);

      if (data.count > results.length) {
        console.log(chalk.dim(`\nShowing ${results.length} of ${data.count} total results`));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
