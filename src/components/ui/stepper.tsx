import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperContextValue {
  activeStep: number
  totalSteps: number
}

const StepperContext = React.createContext<StepperContextValue>({
  activeStep: 0,
  totalSteps: 0,
})

interface StepperProps {
  activeStep: number
  children: React.ReactNode
  className?: string
}

export function Stepper({ activeStep, children, className }: StepperProps) {
  const steps = React.Children.toArray(children)
  
  return (
    <StepperContext.Provider value={{ activeStep, totalSteps: steps.length }}>
      <div className={cn("space-y-4", className)}>
        {/* Step Headers */}
        <div className="flex items-center justify-between">
          {steps.map((_, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    index < activeStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : index === activeStep
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {index < activeStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] flex-1 mx-2 transition-colors",
                    index < activeStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Active Step Content */}
        <div className="mt-6">{steps[activeStep]}</div>
      </div>
    </StepperContext.Provider>
  )
}

interface StepProps {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Step({ label, description, children, className }: StepProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold">{label}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

Stepper.Step = Step
