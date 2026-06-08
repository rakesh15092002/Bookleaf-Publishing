// utils/apiResponse.js
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  })
}

const createdResponse = (res, data, message = 'Created') => {
  return successResponse(res, data, message, 201)
}

const forbiddenResponse = (res, message = 'Access denied') => {
  return errorResponse(res, message, 403)
}

const notFoundResponse = (res, message = 'Not found') => {
  return errorResponse(res, message, 404)
}

const apiResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const success = statusCode >= 200 && statusCode < 300
  return res.status(statusCode).json({
    success,
    message,
    ...(data !== null && { data })
  })
}

export { 
  successResponse, 
  errorResponse,
  createdResponse,
  forbiddenResponse,
  notFoundResponse,
  apiResponse
}