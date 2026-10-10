package com.ssa.schoolerp.repository;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Identifiable;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Stream;

/**
 * One database table, behind the same small API the services used when data was held in memory.
 * Writes join the caller's transaction, or run in their own when there is none.
 *
 * <p>{@link #findWhere} and {@link #stream} load the whole table and filter in Java. That is fine at
 * the size of one school; if a table grows large, add a targeted JPQL query for the hot path.
 */
public class TableRepository<T extends Identifiable> {

    private final Class<T> type;
    private final String displayName;
    private final EntityManager em;
    private final TransactionTemplate tx;

    public TableRepository(Class<T> type, String displayName, EntityManager em, TransactionTemplate tx) {
        this.type = type;
        this.displayName = displayName;
        this.em = em;
        this.tx = tx;
    }

    public List<T> findAll() {
        return em.createQuery("select e from " + type.getSimpleName() + " e", type).getResultList();
    }

    public Stream<T> stream() {
        return findAll().stream();
    }

    public List<T> findWhere(Predicate<? super T> predicate) {
        return stream().filter(predicate).toList();
    }

    /**
     * Rows matching a JPQL condition, filtered by the database (uses indexes) instead of in Java. The entity
     * alias is {@code e} and parameters are positional: {@code where("e.studentId = ?1 and e.date >= ?2", id, from)}.
     * The condition may end with an {@code order by} clause.
     */
    public List<T> where(String condition, Object... params) {
        return whereLimited(0, condition, params);
    }

    /** Like {@link #where} but returns at most {@code limit} rows (0 = no limit). */
    public List<T> whereLimited(int limit, String condition, Object... params) {
        TypedQuery<T> query = em.createQuery("select e from " + type.getSimpleName() + " e where " + condition, type);
        bind(query, params);
        if (limit > 0) {
            query.setMaxResults(limit);
        }
        return query.getResultList();
    }

    /**
     * Runs a JPQL aggregate over this table, e.g.
     * {@code aggregate("select e.status, count(e) from %s e where e.date = ?1 group by e.status", date)};
     * {@code %s} is replaced by the entity name. Each row is an Object[] of the selected values.
     */
    public List<Object[]> aggregate(String jpqlTemplate, Object... params) {
        TypedQuery<Object[]> query = em.createQuery(jpqlTemplate.formatted(type.getSimpleName()), Object[].class);
        bind(query, params);
        return query.getResultList();
    }

    private static void bind(TypedQuery<?> query, Object... params) {
        for (int i = 0; i < params.length; i++) {
            query.setParameter(i + 1, params[i]);
        }
    }

    public Optional<T> findById(String id) {
        return id == null ? Optional.empty() : Optional.ofNullable(em.find(type, id));
    }

    /** Like {@link #findById} but answers 404 when the record does not exist. */
    public T getById(String id) {
        return findById(id).orElseThrow(() -> ApiErrors.notFound(displayName, id));
    }

    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    /** Inserts or replaces the row with this id. */
    public T save(T item) {
        return tx.execute(status -> em.merge(item));
    }

    /**
     * Inserts many brand-new rows at once (no "does it exist?" lookups, unlike {@link #save}). Use only for rows
     * with fresh ids, such as notifications.
     */
    public void insertAll(List<T> items) {
        tx.executeWithoutResult(status -> {
            for (int i = 0; i < items.size(); i++) {
                em.persist(items.get(i));
                if (i % 200 == 199) {
                    em.flush();
                }
            }
        });
    }

    public boolean deleteById(String id) {
        Boolean deleted = tx.execute(status -> {
            T existing = em.find(type, id);
            if (existing == null) {
                return false;
            }
            em.remove(existing);
            return true;
        });
        return Boolean.TRUE.equals(deleted);
    }

    public void deleteWhere(Predicate<? super T> predicate) {
        // Removing entity by entity (not a bulk JPQL delete) also clears their element-collection rows.
        tx.executeWithoutResult(status -> findAll().stream().filter(predicate).forEach(em::remove));
    }

    public int count() {
        return em.createQuery("select count(e) from " + type.getSimpleName() + " e", Long.class)
                .getSingleResult().intValue();
    }

    public void clear() {
        deleteWhere(e -> true);
    }
}
