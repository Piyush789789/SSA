package com.ssa.schoolerp.repository;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Identifiable;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Stream;

/**
 * Thread-safe, insertion-ordered in-memory table. Stands in for a database until a real
 * persistence layer is added; data is lost on restart.
 */
public class InMemoryRepository<T extends Identifiable> {

    private final String entityName;
    private final Map<String, T> items = new LinkedHashMap<>();

    public InMemoryRepository(String entityName) {
        this.entityName = entityName;
    }

    public synchronized List<T> findAll() {
        return List.copyOf(items.values());
    }

    public Stream<T> stream() {
        return findAll().stream();
    }

    public List<T> findWhere(Predicate<? super T> predicate) {
        return stream().filter(predicate).toList();
    }

    public synchronized Optional<T> findById(String id) {
        return id == null ? Optional.empty() : Optional.ofNullable(items.get(id));
    }

    /** Like {@link #findById} but answers 404 when the record does not exist. */
    public T getById(String id) {
        return findById(id).orElseThrow(() -> ApiErrors.notFound(entityName, id));
    }

    public synchronized boolean existsById(String id) {
        return id != null && items.containsKey(id);
    }

    public synchronized T save(T item) {
        items.put(item.id(), item);
        return item;
    }

    public synchronized boolean deleteById(String id) {
        return items.remove(id) != null;
    }

    public synchronized void deleteWhere(Predicate<? super T> predicate) {
        items.values().removeIf(predicate);
    }

    public synchronized int count() {
        return items.size();
    }

    public synchronized void clear() {
        items.clear();
    }
}
