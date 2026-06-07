import bookRepository from '../repositories/book.repository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const getBooksByAuthor = async (authorId) => {
  const books = await bookRepository.findByAuthorId(authorId);

  // Handle empty state
  if (!books || books.length === 0) {
    return [];
  }

  return books.map(book => ({
    id: book.id,
    title: book.title,
    isbn: book.isbn || 'Not yet assigned',
    genre: book.genre,
    status: book.status,
    mrp: book.mrp,
    copies_sold: book.copies_sold || 0,
    total_copies_sold: book.copies_sold || 0,
    royalty_earned: book.royalty_earned || 0,
    total_royalty_earned: book.royalty_earned || 0,
    royalty_paid: book.royalty_paid || 0,
    royalty_pending: book.royalty_pending || 0,
    last_payout_date: book.last_payout_date || null,
    print_partner: book.print_partner || null,
    available_on: book.available_on || [],
    publication_date: book.publication_date || null
  }));
};

const getBookById = async (bookId, authorId = null) => {
  const book = await bookRepository.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  // If author is requesting — verify ownership
  if (authorId && book.author_id !== authorId) {
    throw new AppError('Access denied — this book does not belong to you', 403);
  }

  return book;
};

const getAllBooks = async () => {
  const books = await bookRepository.findAll();
  return books || [];
};

const getRoyaltySummary = async (bookId) => {
  const book = await bookRepository.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  return {
    id: book.id,
    title: book.title,
    author_id: book.author_id,
    copies_sold: book.copies_sold || 0,
    royalty_earned: book.royalty_earned || 0,
    royalty_paid: book.royalty_paid || 0,
    royalty_pending: book.royalty_pending || 0,
    last_payout_date: book.last_payout_date || null
  };
};

export default { getBooksByAuthor, getBookById, getAllBooks, getRoyaltySummary };