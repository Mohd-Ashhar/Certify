import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, ArrowRight, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/FormElements';
import './GapAnalysis.css';

const QUESTION_KEYS = ['gapAnalysis.q1', 'gapAnalysis.q2', 'gapAnalysis.q3', 'gapAnalysis.q4', 'gapAnalysis.q5'];

export default function GapAnalysis() {
  const { user, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [answers, setAnswers] = useState(Array(QUESTION_KEYS.length).fill(null));
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

    if (currentIdx < QUESTION_KEYS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const yesCount = answers.filter(a => a === true).length;
    const finalScore = Math.round((yesCount / QUESTION_KEYS.length) * 100);

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
            <h2>{t('gapAnalysis.resultsTitle')}</h2>
            <div className="gap-analysis__score">{t('dashboard.yourScore', { score })}</div>
            <p className="gap-analysis__text">
              {t('gapAnalysis.lowScoreMsg', { score })}
            </p>
            <p className="gap-analysis__text">
              {t('gapAnalysis.lowScoreHelp')}
            </p>
            <div className="gap-analysis__actions" style={{ justifyContent: 'center' }}>
              <Button onClick={() => navigate(getRoleDashboard(user?.role))}>{t('gapAnalysis.goToDashboard')}</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container gap-analysis-page">
        <div className="gap-analysis__content">
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
          <h2>{t('gapAnalysis.readyTitle')}</h2>
          <div className="gap-analysis__score gap-analysis__score--success">{t('dashboard.yourScore', { score })}</div>
          <p className="gap-analysis__text">
            {t('gapAnalysis.highScoreMsg')}
          </p>
          <div className="gap-analysis__actions" style={{ justifyContent: 'center' }}>
            <Button onClick={() => navigate(getRoleDashboard(user?.role))}>{t('gapAnalysis.goToDashboard')}</Button>
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
          <h2>{t('gapAnalysis.title')}</h2>
          <p>{t('gapAnalysis.subtitle')}</p>
        </div>

        <div className="gap-analysis__progress">
          {t('gapAnalysis.questionOf', { current: currentIdx + 1, total: QUESTION_KEYS.length })}
          <div className="gap-analysis__progress-bar">
            <div
              className="gap-analysis__progress-fill"
              style={{ width: `${((currentIdx) / QUESTION_KEYS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="gap-analysis__question-card">
          <h3 className="gap-analysis__question">{t(QUESTION_KEYS[currentIdx])}</h3>
          <div className="gap-analysis__options">
            <button
              className={`gap-analysis__option ${answers[currentIdx] === true ? 'selected-yes' : ''}`}
              onClick={() => handleAnswer(true)}
            >
              <div className="gap-analysis__option-radio">
                {answers[currentIdx] === true && <div className="gap-analysis__option-radio-fill" />}
              </div>
              {t('common.yes')}
            </button>
            <button
              className={`gap-analysis__option ${answers[currentIdx] === false ? 'selected-no' : ''}`}
              onClick={() => handleAnswer(false)}
            >
              <div className="gap-analysis__option-radio">
                {answers[currentIdx] === false && <div className="gap-analysis__option-radio-fill" />}
              </div>
              {t('common.no')}
            </button>
          </div>
        </div>

        <div className="gap-analysis__actions">
          <Button
            variant="secondary"
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            {t('common.back')}
          </Button>

          {currentIdx === QUESTION_KEYS.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={answers[currentIdx] === null || submitting}
              loading={submitting}
            >
              {t('gapAnalysis.seeResults')} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setCurrentIdx(prev => Math.min(QUESTION_KEYS.length - 1, prev + 1))}
              disabled={answers[currentIdx] === null}
            >
              {t('common.next')} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
