package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A library title; {@code copies} is how many the library owns, {@code available} how many are on the shelf. */
@Entity
@JsonFields
public class Book implements Identifiable {

    @Id
    private String id;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 120)
    private String author;

    @Size(max = 20)
    private String isbn;

    @Size(max = 60)
    private String category;

    @Size(max = 30)
    private String shelf;

    @Min(1)
    private int copies;

    private int available;

    protected Book() {
    }

    public Book(String id, String title, String author, String isbn, String category, String shelf, int copies,
                int available) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.category = category;
        this.shelf = shelf;
        this.copies = copies;
        this.available = available;
    }

    public Book withAvailable(int newAvailable) {
        return new Book(id, title, author, isbn, category, shelf, copies, newAvailable);
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public String author() {
        return author;
    }

    public String isbn() {
        return isbn;
    }

    public String category() {
        return category;
    }

    public String shelf() {
        return shelf;
    }

    public int copies() {
        return copies;
    }

    public int available() {
        return available;
    }
}
