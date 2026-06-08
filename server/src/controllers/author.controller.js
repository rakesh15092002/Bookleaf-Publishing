import userRepository from '../repositories/user.repository.js';
import booksService from '../services/books.service.js';
import { apiResponse } from '../utils/apiResponse.js';

/**
 * AuthorController handles all administrative actions related to Authors.
 * This ensures the Admin has full oversight of the user registry as required 
 * by the BookLeaf Support Portal assignment.
 */
const authorController = {
  
  // Fetch all registered authors for the Admin Registry view
  getAllAuthors: async (req, res, next) => {
    try {
      // Fetch only users with the 'author' role from the database
      const authors = await userRepository.findByRole('author');
      
      // Return a clean API response
      return apiResponse(res, 200, 'Authors fetched successfully', authors);
    } catch (error) {
      // Pass errors to the global error middleware
      next(error);
    }
  },

  // Fetch detailed information for a specific author by their unique ID
  getAuthorById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Retrieve the author from the repository
      const author = await userRepository.findById(id);
      
      // Handle case where author does not exist
      if (!author) {
        return apiResponse(res, 404, 'Author not found');
      }

      // Resolve author books for the admin detail panel
      const authorBusinessId = author.author_id || id;
      const books = await booksService.getBooksByAuthor(authorBusinessId);
      const authorDetails = {
        ...author,
        books,
        bookCount: books.length,
        publishedBookCount: books.filter((book) => book.status?.toLowerCase() === 'published').length
      };
      
      return apiResponse(res, 200, 'Author details fetched', authorDetails);
    } catch (error) {
      next(error);
    }
  }
};

export default authorController;