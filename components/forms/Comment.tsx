"use client";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { commentValidation } from "@/lib/validations/thread";
import Image from "next/image";

// import { createThread } from "@/lib/actions/thread.actions";

import * as z from "zod";
import { Input } from "../ui/input";
import { addComment } from "@/lib/actions/thread.actions";

interface Props {
    threadId: string,
    currentUserImage: string,
    currentUserId: string
}

const Comment = ({threadId, currentUserImage, currentUserId}: Props) => {
    const router = useRouter();
    const pathname = usePathname();
    
    const form = useForm({
        resolver: zodResolver(commentValidation),
        defaultValues: {
            thread: ""
        }
    });

    const onSubmit = async (values: z.infer<typeof commentValidation>) => {    
        await addComment(threadId, values.thread, JSON.parse(currentUserId), pathname);
        form.reset();
    }

    return (
        <Form {...form}>
        <form
          className='comment-form'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name='thread'
            render={({ field }) => (
              <FormItem className='flex w-full items-center gap-3'>
                <FormLabel>
                  <Image src={currentUserImage} alt="current-user" width={48} height={48} className="rounded-full object-cover"/>
                </FormLabel>
                <FormControl className='border-none bg-transparent'>
                  <Input type="text" placeholder="Comment ..." className="no-focus text-light-1 outline-none" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
  
          <Button type='submit' className='comment-form_btn'>
            Reply
          </Button>
        </form>
      </Form>
    )


}

export default Comment;