package com.ssa.schoolerp.repository;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Identifiable;
import jakarta.persistence.EntityManager;
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
