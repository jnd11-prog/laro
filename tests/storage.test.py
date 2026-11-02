"""Exercise the actual migration and mutation SQL against SQLite."""
import json,re,sqlite3,unittest
from pathlib import Path

source=Path('lib/server.ts').read_text()
def sql(prefix):
    statements=re.findall(r"prepare\('([^']+)'\)",source)
    return next(s for s in statements if s.startswith(prefix))

class StorageTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        for p in sorted(Path('drizzle').glob('*.sql')):self.db.executescript(p.read_text().replace('--> statement-breakpoint',''))
        self.db.execute('INSERT INTO clubs VALUES (?,?,?,?)',('club-a','owner-a','invite-a',0))
        self.db.execute('INSERT INTO clubs VALUES (?,?,?,?)',('club-b','owner-b','invite-b',0))
        self.db.execute('INSERT INTO careers VALUES (?,?,?)',('club-a','{}',0));self.db.commit()
    def mutate(self,version,event,xp):
        with self.db:
            cursor=self.db.execute(sql('UPDATE careers SET'),(json.dumps({'xp':xp}),'club-a',version))
            changed=cursor.rowcount
            self.db.execute(sql('INSERT INTO events'),(event,'club-a','{}',0))
        return changed
    def test_stale_version_cannot_overwrite_career_or_append_event(self):
        self.assertEqual(self.mutate(0,'a',30),1)
        self.assertEqual(self.mutate(0,'b',60),0)
        self.assertEqual(self.db.execute('SELECT version,state FROM careers').fetchone(),(1,'{"xp": 30}'))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM events').fetchone()[0],1)
    def test_duplicate_event_rolls_back_both_writes(self):
        self.mutate(0,'repeat',30)
        with self.assertRaises(sqlite3.IntegrityError):self.mutate(1,'repeat',60)
        self.assertEqual(self.db.execute('SELECT version FROM careers').fetchone()[0],1)
    def test_mutation_replay_lookup_is_scoped_to_club(self):
        self.mutate(0,'club-a:request',30)
        query=sql('SELECT payload FROM events')
        self.assertIsNotNone(self.db.execute(query,('club-a:request','club-a')).fetchone())
        self.assertIsNone(self.db.execute(query,('club-a:request','club-b')).fetchone())
    def test_schema_enforces_membership_and_one_career_per_club(self):
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute('INSERT INTO careers VALUES (?,?,?)',('club-a','{}',0))
        self.db.execute('INSERT INTO members VALUES (?,?,?)',('learner','club-a','learner'))
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute('INSERT INTO members VALUES (?,?,?)',('learner','club-b','owner'))

if __name__=='__main__':unittest.main()
