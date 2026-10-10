import { useState } from 'react';
import { Text, View } from 'react-native';

import { formatDate, rupees, todayIso } from '../format';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Badge, Button, Card, Chips, Empty, Field, Loaded, Screen, styles } from '../ui';

const SECTIONS = [
  { label: 'My loans', value: 'loans' },
  { label: 'Catalogue', value: 'catalogue' },
];
const MAX_SHOWN = 60;

export function isOverdue(loan, today = todayIso()) {
  return !loan.returnedOn && loan.dueOn && loan.dueOn < today;
}

/** One library issue: book, dates, overdue in red, fine when returned late. */
export function LoanCard({ loan, showBorrower = false, children }) {
  const overdue = isOverdue(loan);
  const badge = loan.returnedOn
    ? { label: 'Returned', tone: 'neutral' }
    : overdue
      ? { label: 'Overdue', tone: 'danger' }
      : { label: 'Issued', tone: 'info' };
  return (
    <Card title={loan.bookTitle} right={<Badge label={badge.label} tone={badge.tone} />}>
      {showBorrower ? (
        <Text style={[styles.body, { fontWeight: '600' }]}>
          {loan.borrowerName}
          {loan.className ? ` · Class ${loan.className}` : loan.borrowerType ? ` · ${loan.borrowerType.toLowerCase()}` : ''}
        </Text>
      ) : null}
      <Text style={styles.muted}>Issued {formatDate(loan.issuedOn)}</Text>
      <Text style={[styles.muted, overdue && { color: colors.danger, fontWeight: '700' }]}>
        {loan.returnedOn ? `Returned ${formatDate(loan.returnedOn)}` : `Due ${formatDate(loan.dueOn)}`}
      </Text>
      {loan.fine ? <Text style={[styles.muted, { color: colors.danger }]}>Fine {rupees(loan.fine)}</Text> : null}
      {children}
    </Card>
  );
}

/**
 * Library for students, parents (pass the child's `studentId`) and teachers: the books on loan (overdue in
 * red) plus a catalogue search showing how many copies are available.
 */
export function LibraryScreen({ studentId, header }) {
  const [section, setSection] = useState('loans');
  return section === 'loans' ? (
    <MyLoans studentId={studentId} header={<>{header}<Chips options={SECTIONS} value={section} onChange={setSection} /></>} />
  ) : (
    <CatalogueSearch header={<>{header}<Chips options={SECTIONS} value={section} onChange={setSection} /></>} />
  );
}

function MyLoans({ studentId, header }) {
  const state = useApi(studentId ? `/library/my-loans?studentId=${encodeURIComponent(studentId)}` : '/library/my-loans');
  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(list) => {
          if (list.length === 0) return <Empty text="No library books borrowed." icon="library-outline" />;
          // Open loans first (overdue on top), then returned ones.
          const sorted = [...list].sort((a, b) => rank(a) - rank(b) || String(a.dueOn).localeCompare(String(b.dueOn)));
          return sorted.map((loan) => <LoanCard key={loan.id} loan={loan} />);
        }}
      </Loaded>
    </Screen>
  );
}

function rank(loan) {
  if (isOverdue(loan)) return 0;
  return loan.returnedOn ? 2 : 1;
}

/** Search the catalogue by title, author, ISBN or category. */
export function CatalogueSearch({ header }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const state = useApi(`/library/books${query ? `?q=${encodeURIComponent(query)}` : ''}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Field
          value={text}
          onChangeText={setText}
          placeholder="Title, author or ISBN"
          returnKeyType="search"
          onSubmitEditing={() => setQuery(text.trim())}
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
        <Button title="Search" icon="search-outline" onPress={() => setQuery(text.trim())} style={{ paddingVertical: 11 }} />
      </View>
      <Loaded state={state}>
        {(books) =>
          books.length === 0 ? (
            <Empty text={query ? 'No books match your search.' : 'The catalogue is empty.'} icon="search-outline" />
          ) : (
            <>
              {books.slice(0, MAX_SHOWN).map((book) => (
                <Card
                  key={book.id}
                  title={book.title}
                  right={<Badge label={`${book.available}/${book.copies} available`} tone={book.available > 0 ? 'success' : 'danger'} />}
                >
                  <Text style={styles.body}>{book.author || '—'}</Text>
                  <Text style={styles.muted}>
                    {[book.category, book.shelf ? `Shelf ${book.shelf}` : null, book.isbn ? `ISBN ${book.isbn}` : null].filter(Boolean).join(' · ')}
                  </Text>
                </Card>
              ))}
              {books.length > MAX_SHOWN ? (
                <Text style={[styles.muted, { textAlign: 'center' }]}>
                  Showing {MAX_SHOWN} of {books.length}. Search to narrow the list.
                </Text>
              ) : null}
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}
