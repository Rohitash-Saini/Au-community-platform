const TeacherProfile = require("../models/teacherprofile");
const User = require("../models/user");
const Follow = require("../models/follow");
const Post = require("../models/post");

// Create Teacher Profile
const createTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      bio,
      designation,
      expertise,
      teachingTags,
      experience,
      linkedin,
      github,
      isAvailable,
    } = req.body;

    let existingProfile = await TeacherProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile already exists for this user",
      });
    }

    // Update user role to teacher if not already
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "teacher") {
      user.role = "teacher";
      await user.save();
    }

    const teacherProfile = await TeacherProfile.create({
      user: userId,
      bio,
      designation,
      expertise,
      teachingTags,
      experience,
      linkedin,
      github,
      isAvailable,
    });

    const populatedProfile = await TeacherProfile.findById(teacherProfile._id).populate(
      "user",
      "name email role profilePicture bio linkedin github skills"
    );

    return res.status(201).json({
      success: true,
      message: "Teacher profile created successfully",
      teacherProfile: populatedProfile,
    });
  } catch (error) {
    console.error("Create teacher profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Teacher Profile by ID (profile ID or user ID)
const getTeacherProfile = async (req, res) => {
  try {
    const { id } = req.params;

    let profile = await TeacherProfile.findById(id).populate(
      "user",
      "name email role profilePicture bio linkedin github skills jobStatus"
    );

    if (!profile) {
      profile = await TeacherProfile.findOne({ user: id }).populate(
        "user",
        "name email role profilePicture bio linkedin github skills jobStatus"
      );
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher profile fetched successfully",
      teacherProfile: profile,
    });
  } catch (error) {
    console.error("Get teacher profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Teacher Profile
const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      bio,
      designation,
      expertise,
      teachingTags,
      experience,
      linkedin,
      github,
      isAvailable,
    } = req.body;

    let profile = await TeacherProfile.findOne({ user: userId });

    if (!profile) {
      // If profile doesn't exist, create it
      profile = new TeacherProfile({ user: userId });
    }

    if (bio !== undefined) profile.bio = bio;
    if (designation !== undefined) profile.designation = designation;
    if (expertise !== undefined) profile.expertise = expertise;
    if (teachingTags !== undefined) profile.teachingTags = teachingTags;
    if (experience !== undefined) profile.experience = experience;
    if (linkedin !== undefined) profile.linkedin = linkedin;
    if (github !== undefined) profile.github = github;
    if (isAvailable !== undefined) profile.isAvailable = isAvailable;

    await profile.save();

    const updatedProfile = await TeacherProfile.findById(profile._id).populate(
      "user",
      "name email role profilePicture bio linkedin github skills"
    );

    return res.status(200).json({
      success: true,
      message: "Teacher profile updated successfully",
      teacherProfile: updatedProfile,
    });
  } catch (error) {
    console.error("Update teacher profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get All Teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await TeacherProfile.find().populate(
      "user",
      "name email role profilePicture bio linkedin github skills jobStatus"
    );

    return res.status(200).json({
      success: true,
      message: "Teachers fetched successfully",
      totalTeachers: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get all teachers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Search Teachers
const searchTeachers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return getAllTeachers(req, res);
    }

    const searchRegex = new RegExp(query.trim(), "i");

    const teachers = await TeacherProfile.find({
      $or: [
        { designation: searchRegex },
        { expertise: searchRegex },
        { teachingTags: searchRegex },
      ],
    }).populate(
      "user",
      "name email role profilePicture bio linkedin github skills jobStatus"
    );

    return res.status(200).json({
      success: true,
      message: "Search teachers completed",
      totalTeachers: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Search teachers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Teacher Posts
const getTeacherPosts = async (req, res) => {
  try {
    const { id } = req.params;

    // id could be teacher profile id or user id
    let userId = id;
    const profile = await TeacherProfile.findById(id);
    if (profile) {
      userId = profile.user;
    }

    const posts = await Post.find({ author: userId })
      .populate("author", "name email role profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Teacher posts fetched successfully",
      totalPosts: posts.length,
      posts,
    });
  } catch (error) {
    console.error("Get teacher posts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Follow Teacher
const followTeacher = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { id: teacherId } = req.params;

    let targetUserId = teacherId;
    const profile = await TeacherProfile.findById(teacherId);
    if (profile) {
      targetUserId = profile.user;
    }

    if (followerId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "You are already following this teacher",
      });
    }

    await Follow.create({
      follower: followerId,
      following: targetUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Followed teacher successfully",
    });
  } catch (error) {
    console.error("Follow teacher error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Unfollow Teacher
const unfollowTeacher = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { id: teacherId } = req.params;

    let targetUserId = teacherId;
    const profile = await TeacherProfile.findById(teacherId);
    if (profile) {
      targetUserId = profile.user;
    }

    const deleted = await Follow.findOneAndDelete({
      follower: followerId,
      following: targetUserId,
    });

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "You are not following this teacher",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Unfollowed teacher successfully",
    });
  } catch (error) {
    console.error("Unfollow teacher error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createTeacherProfile,
  getTeacherProfile,
  updateTeacherProfile,
  getAllTeachers,
  searchTeachers,
  getTeacherPosts,
  followTeacher,
  unfollowTeacher,
};
