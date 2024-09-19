/**
 * Types needed for the Publisher model beyond the model declaration itself.
 */

export type PublisherForBook = {
  id?: number;
  name?: string;
  notes?: string;
};

export type PublisherNewData = {
  id?: number;
  name: string;
  notes?: string;
};

export type PublisherUpdateData = {
  name?: string;
  notes?: string;
};
