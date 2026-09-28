import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';
import m0001 from './0001_uz_default_categories.sql';
import m0002 from './0002_occurred_id_index.sql';
import m0003 from './0003_account_card_number.sql';
import m0004 from './0004_uz_categories_v2.sql';
import m0005 from './0005_fitness_category.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005
    }
  }
  