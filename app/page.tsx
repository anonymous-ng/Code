import { createClient } from "@/lib/supabase/server"
import { QuizClient } from "@/components/quiz-client"
import type { Label } from "@/lib/types"

export default async function Home() {
  const supabase = await createClient()

  // Fetch all labels for the category selector
  const { data: labels } = await supabase.from("labels").select("*").order("name")

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-balance mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            QuizMaster
          </h1>
          <p className="text-muted-foreground text-lg">Test your knowledge across multiple subjects</p>
        </div>

        <QuizClient labels={(labels as Label[]) || []} />
      </div>
    </main>
  )
}
