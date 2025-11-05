"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Label, QuestionWithLabel } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react"

interface QuizClientProps {
  labels: Label[]
}

export function QuizClient({ labels }: QuizClientProps) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<QuestionWithLabel | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allAnswers, setAllAnswers] = useState<string[]>([])

  const supabase = createClient()

  // Load a random question based on selected labels
  const loadRandomQuestion = async () => {
    setLoading(true)
    setSelectedAnswer(null)
    setShowResult(false)

    try {
      let query = supabase.from("questions").select("*, labels(*)")

      // Filter by selected labels if any
      if (selectedLabels.length > 0) {
        query = query.in("label_id", selectedLabels)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        // Pick a random question
        const randomIndex = Math.floor(Math.random() * data.length)
        const question = data[randomIndex] as QuestionWithLabel

        // Shuffle answers
        const answers = [question.correct_answer, ...question.wrong_answers]
        const shuffled = answers.sort(() => Math.random() - 0.5)

        setCurrentQuestion(question)
        setAllAnswers(shuffled)
      }
    } catch (error) {
      console.error("[v0] Error loading question:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load first question on mount or when labels change
  useEffect(() => {
    loadRandomQuestion()
  }, [selectedLabels])

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]))
  }

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
  }

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return

    const correct = selectedAnswer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    loadRandomQuestion()
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <Badge
                key={label.id}
                variant={selectedLabels.includes(label.id) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                onClick={() => handleLabelToggle(label.id)}
              >
                {label.name}
              </Badge>
            ))}
            {selectedLabels.length > 0 && (
              <Badge
                variant="secondary"
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setSelectedLabels([])}
              >
                Clear All
              </Badge>
            )}
          </div>
          {selectedLabels.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">All categories selected by default</p>
          )}
        </CardContent>
      </Card>

      {/* Question Card */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : currentQuestion ? (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary">{currentQuestion.labels.name}</Badge>
            </div>
            <CardTitle className="text-2xl text-balance leading-relaxed">{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answer Options */}
            <div className="grid gap-3">
              {allAnswers.map((answer, index) => {
                const isSelected = selectedAnswer === answer
                const isCorrectAnswer = answer === currentQuestion.correct_answer
                const showCorrect = showResult && isCorrectAnswer
                const showWrong = showResult && isSelected && !isCorrectAnswer

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(answer)}
                    disabled={showResult}
                    className={`
                      w-full p-4 text-left rounded-lg border-2 transition-all
                      ${isSelected && !showResult ? "border-primary bg-primary/5" : "border-border"}
                      ${showCorrect ? "border-green-500 bg-green-50" : ""}
                      ${showWrong ? "border-red-500 bg-red-50" : ""}
                      ${!showResult ? "hover:border-primary/50 hover:bg-accent cursor-pointer" : "cursor-default"}
                      disabled:opacity-100
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{answer}</span>
                      {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {showWrong && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Result Section */}
            {showResult && (
              <div
                className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg mb-1">{isCorrect ? "Correct!" : "Incorrect"}</h3>
                    <p className="text-sm leading-relaxed mb-3">
                      <strong>Explanation:</strong> {currentQuestion.explanation}
                    </p>
                    {currentQuestion.additional_info && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <strong>More Info:</strong> {currentQuestion.additional_info}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!showResult ? (
                <Button onClick={handleSubmit} disabled={!selectedAnswer} className="flex-1" size="lg">
                  Submit Answer
                </Button>
              ) : (
                <>
                  <Button onClick={handleNextQuestion} className="flex-1" size="lg">
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button onClick={handleNextQuestion} variant="outline" size="lg">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-4">No questions available for the selected categories</p>
            <Button onClick={() => setSelectedLabels([])}>Show All Categories</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
