import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Icon from '../common/Icon/Icon';
import Button from '../common/Button/Button';
import HeadlessSelect from '../common/HeadlessSelect/HeadlessSelect';
import { reviewService } from '../../services/uxService';
import { ROUTES } from '../../constants';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'helpful', label: 'Most helpful' },
  { value: 'rating', label: 'Highest rating' },
];

export const ProductReviews = ({ productId, initialReviews = [], onChanged }) => {
  const isAuthed = Boolean(useSelector((state) => state.auth.accessToken || state.auth.token || state.auth.user));
  const [reviews, setReviews] = useState(initialReviews);
  const [sort, setSort] = useState('newest');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async (nextSort = sort) => {
    if (!productId) return;
    try {
      const data = await reviewService.list(productId, nextSort);
      setReviews(Array.isArray(data) ? data : data?.items || []);
    } catch {
      /* keep current */
    }
  };

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    load(sort);
  }, [productId, sort]);

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthed) return;
    setBusy(true);
    setError('');
    try {
      const images = imagesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 5);
      await reviewService.create({ productId, rating, comment, images });
      setComment('');
      setImagesText('');
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  };

  const helpful = async (id) => {
    if (!isAuthed) return;
    try {
      await reviewService.markHelpful(id);
      await load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-text-primary">Reviews</h2>
        <HeadlessSelect
          value={sort}
          options={SORT_OPTIONS}
          onChange={setSort}
          className="w-44"
          buttonClassName="bg-background-secondary"
        />
      </div>

      {isAuthed ? (
        <form onSubmit={submit} className="mb-6 space-y-3 rounded-2xl border border-border bg-background-secondary p-4">
          <p className="text-sm font-semibold">Write a review</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => setRating(value)} className="text-warning" aria-label={`${value} stars`}>
                <Icon name="star" size={5} className={`cursor-pointer ${value <= rating ? 'fill-warning' : 'text-border'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            rows={2}
            placeholder="Optional image URLs (one per line, max 5)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <Button disabled={busy} type="submit" className="rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white">
            Submit review
          </Button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-text-muted">
          <Link to={ROUTES.LOGIN} className="font-semibold text-warning">
            Log in
          </Link>{' '}
          to write a review.
        </p>
      )}

      {reviews.length ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-xl border border-border bg-background-secondary p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm">{review.userId?.name || review.userName || 'Customer'}</strong>
                <div className="flex text-warning">
                  {[...Array(5)].map((_, index) => (
                    <Icon key={index} name="star" size={3.5} className={`cursor-default ${index < Math.floor(review.rating || 0) ? 'fill-warning' : 'text-border'}`} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-text-muted">{review.comment || review.review || review.title}</p>
              {Array.isArray(review.images) && review.images.length > 0 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {review.images.map((src) => (
                    <img key={src} src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
              <button type="button" onClick={() => helpful(review._id)} className="mt-3 text-xs font-semibold text-text-muted hover:text-warning">
                Helpful ({review.helpfulCount || 0})
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-muted">No reviews yet for this product.</p>
      )}
    </div>
  );
};

export default ProductReviews;
