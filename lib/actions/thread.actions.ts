"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export async function createThread({text, author, communityId, path}: Params) {

    try {
        connectToDB();
        const createdThread = await Thread.create({
            text,
            author,
            community: null
        });

        // Update User model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        })

        revalidatePath(path);
    } catch (error) {
        throw new Error(`Error creating thread: ${error}`);
    }
    
}

export async function addComment(threadId: string, commentText: string, userId: string, path: string) {
    connectToDB();

    try {
        const originalThread = await Thread.findById(threadId);
        if (!originalThread) {
            throw new Error("Can't find original thread!")
        }

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId
        });

        const savedCommentThread = await commentThread.save();
        originalThread.children.push(savedCommentThread._id);
        await originalThread.save();
       
        revalidatePath(path);
    } catch (error) {
        throw new Error(`Error commenting thread: ${error}`);
    }
}

export async function fetchPosts(pageNumber = 1, pageSize=20) {
    connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    const postsQuery = Thread.find({parentId: {$in: [null, undefined]}})
    .sort({createdAt: 'desc'})
    .skip(skipAmount)
    .limit(pageSize)
    .populate({path: 'author', model: User})
    .populate({path: 'children', 
        populate: {
            path: 'author',
            model: User,
            select: "_id name parentId image"
        }
    });

    // Count the total number of top-level posts (threads) i.e., threads that are not comments.
    const totalPostsCount = await Thread.countDocuments({
        parentId: { $in: [null, undefined] },
    }); // Get the total count of posts

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
}

export async function fetchThreadById(id:string) {
    connectToDB();

    try {
        const thread = await Thread.findById(id)
        .populate({path:'author', model:User, select:"_id id name image"})
        .populate({path:'children', populate:[
            {
                path: 'author',
                model: User,
                select: "_id name parentId image"
            },
            {
                path: "children",
                model: Thread,
                populate: {
                    path: 'author',
                    model: User,
                    select: "_id name parentId image"
                }
            }
        ]}).exec()
        return thread;
    } catch (error:any) {
        throw new Error(error.message)
    }
}
