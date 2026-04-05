import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, ArrowRight, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/FormElements';
import './GapAnalysis.css';

const QUESTIONS = [
  'Do you have documented operating procedures for your main processes?',
  'Is top management actively involved in and committed to quality/compliance standards?',
  'Do you have a system in place to track customer feedback and handle complaints?',
  'Do you conduct regular internal reviews or audits of your processes?',
  'Do you have a dedicated compliance or quality officer/team?'
];

export default function GapAnalysis() {
  const { user, getRoleDashboard } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // If user already completed gap analysis, redirect to dashboard
  useEffect(() => {
    if (user?.gap_analysis_score != null) {
      navigate(getRoleDashboard(user?.role), { replace: true });
    }
  }, [user]);

  // Don't render the quiz if user already has a score (avoids flash before redirect)
  if (user?.gap_analysis_score != null && score === null) {
    return null;
  }

  const handleAnswer = (val) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = val;
    setAnswers(newAnswers);

    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const yesCount = answers.filter(a => a === true).length;
    const finalScore = (yesCount / QUESTIONS.length) * 100;

    try {
      if (user) {
        await supabase.from('profiles').update({ gap_analysis_score: finalScore }).eq('id', user.id);
      }
      setScore(finalScore);
    } catch (err) {
      console.error('Error saving score:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (score !== null) {
    if (score < 60) {
      return (
        <div className="page-container gap-analysis-page">
          <div className="gap-analysis__content">
            <AlertCircle size={48} color="var(--color-warning)" style={{ margin: '0 auto 16px' }} />
            <h2>Gap Analysis Results</h2>
            <div className="gap-analysis__score">Your Score: {score}%</div>
            <p className="gap-analysis__text">
              Based on your score ({score}%), your organization needs some foundational work in process documentation and management before starting the certification process.
            </p>
            <p className="gap-analysis__text">
              Don't worry! Many companies start here. Please contact our support team to get guidance on how to build these operational foundations.
            </p>
            <div className="gap-analysis__actions" style={{ justifyContent: 'center' }}>
              <Button onClick={() => navigate(getRoleDashboard(user?.role))}>Go to Dashboard</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container gap-analysis-page">
        <div className="gap-analysis__content">
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
          <h2>You are ready for Certification!</h2>
          <div className="gap-analysis__score gap-analysis__score--success">Your Score: {score}%</div>
          <p className="gap-analysis__text">
            Excellent! Your organization demonstrates strong foundational practices. Head to your dashboard to view recommended certifications and begin your certification journey.
          </p>
          <div className="gap-analysis__actions" style={{ justifyContent: 'center' }}>
            <Button onClick={() => navigate(getRoleDashboard(user?.role))}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container gap-analysis-page">
      <div className="gap-analysis__content">
        <button
          className="gap-analysis__close-btn"
          onClick={() => navigate(getRoleDashboard(user?.role))}
          title="Close"
        >
          <X size={20} />
        </button>

        <div className="gap-analysis__header">
          <Shield size={32} color="var(--color-accent)" />
          <h2>ISO Readiness Gap Analysis</h2>
          <p>Answer a few quick questions to determine your organization's readiness for ISO certification.</p>
        </div>

        <div className="gap-analysis__progress">
          Question {currentIdx + 1} of {QUESTIONS.length}
          <div className="gap-analysis__progress-bar">
            <div
              className="gap-analysis__progress-fill"
              style={{ width: `${((currentIdx) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="gap-analysis__question-card">
          <h3 className="gap-analysis__question">{QUESTIONS[currentIdx]}</h3>
          <div className="gap-analysis__options">
            <button
              className={`gap-analysis__option ${answers[currentIdx] === true ? 'selected-yes' : ''}`}
              onClick={() => handleAnswer(true)}
            >
              <div className="gap-analysis__option-radio">
                {answers[currentIdx] === true && <div className="gap-analysis__option-radio-fill" />}
              </div>
              Yes
            </button>
            <button
              className={`gap-analysis__option ${answers[currentIdx] === false ? 'selected-no' : ''}`}
              onClick={() => handleAnswer(false)}
            >
              <div className="gap-analysis__option-radio">
                {answers[currentIdx] === false && <div className="gap-analysis__option-radio-fill" />}
              </div>
              No
            </button>
          </div>
        </div>

        <div className="gap-analysis__actions">
          <Button
            variant="secondary"
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            Back
          </Button>

          {currentIdx === QUESTIONS.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={answers[currentIdx] === null || submitting}
              loading={submitting}
            >
              See Results <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setCurrentIdx(prev => Math.min(QUESTIONS.length - 1, prev + 1))}
              disabled={answers[currentIdx] === null}
            >
              Next <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
