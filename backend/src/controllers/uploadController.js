/**
 * Upload a single file — returns base64 data URI directly (stored in MongoDB)
 * @route POST /api/upload
 * @access Private
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file provided' 
      });
    }

    // Convert buffer to base64 data URI — stored directly in MongoDB (no external storage needed)
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    res.status(200).json({
      success: true,
      url: base64Data,
      type: req.file.mimetype.split('/')[0],
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to process file',
      error: error.message 
    });
  }
};

/**
 * Upload multiple files — returns base64 data URIs directly (stored in MongoDB)
 * @route POST /api/upload/multiple
 * @access Private
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files provided' 
      });
    }

    const processedFiles = req.files.map((file) => {
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return {
        url: base64Data,
        type: file.mimetype.split('/')[0],
        name: file.originalname,
        size: file.size
      };
    });

    res.status(200).json({
      success: true,
      files: processedFiles,
      count: processedFiles.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to process files',
      error: error.message 
    });
  }
};

/**
 * Delete a file — no-op in base64 mode (data is stored inline in MongoDB)
 * @route DELETE /api/upload
 * @access Private
 */
exports.deleteFile = async (req, res) => {
  // In base64 mode, deletion is handled by updating the worklog in MongoDB
  // No external file to delete
  res.status(200).json({
    success: true,
    message: 'File reference cleared (base64 mode — no external storage)'
  });
};

/**
 * Delete multiple files — no-op in base64 mode
 * @route DELETE /api/upload/multiple
 * @access Private
 */
exports.deleteMultipleFiles = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'File references cleared (base64 mode — no external storage)',
    count: (req.body?.urls || []).length
  });
};